const fs = require('fs');
const axios = require('axios');
const path = require('path');
const CJSON =  require('comment-json');

// 🔐 API 키 불러오기
const API_KEY = fs.readFileSync( path.join(__dirname, 'api-key.txt'), 'utf8').trim();

// ⚙️ 설정 불러오기
const configPath = path.join(__dirname, 'config.json');
const configObject = fs.readFileSync(configPath, 'utf8');
const config = CJSON.parse(configObject, null);


const API_URL = config.API_URL;
const MODEL = config.MODEL;
const BATCH_SIZE = config.BATCH_SIZE;
const USER_PROMPT = config.USER_PROMPT;
const SYSTEM_PROMPT = config.SYSTEM_PROMPT;

function chunkArray(array, size) {
    return array.reduce((acc, _, i) =>
        i % size ? acc : [...acc, array.slice(i, i + size)], []);
}

function extractJsonFromMarkdown(responseText) {
    const match = responseText.match(/```json\s*([\s\S]*?)```/);
    if (match) {
        return match[1];
    }
    return responseText;
}

async function translateBatch(batch) {
    const batchJson = Object.fromEntries(batch);

    const prompt = `${USER_PROMPT}\n\n${CJSON.stringify(batchJson, null, 4)}`;

    const headers = {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
    };

    const data = {
        model: MODEL,
        messages: [
            { 
                role: 'system', 
                content: SYSTEM_PROMPT
            },
            { 
                role: 'user', 
                content: prompt
            }
        ]
    };

    try {
        const response = await axios.post(API_URL, data, { headers });
        let content = response.data.choices?.[0]?.message?.content?.trim();

        // 마크다운 코드 블럭 제거
        content = extractJsonFromMarkdown(content);

        return CJSON.parse(content, null);
    } catch (err) {
        console.error('❌ 번역 실패:', err.response?.data || err.message);
        return {};
    }
}

async function main() {
    const inputPath = './input.json';
    const outputPath = './output.json';

    const inputText = fs.readFileSync(inputPath, 'utf8');
    const inputData = CJSON.parse(inputText, null);

    const entries = Object.entries(inputData);
    const chunks = chunkArray(entries, BATCH_SIZE);

    for (let i = 0; i < chunks.length; i++) {
        console.log(`🔄 번역 중 (${i + 1}/${chunks.length})...`);
        const translatedChunk = await translateBatch(chunks[i]);

        // ✅ 주석 객체에 직접 덮어쓰기
        for (const [key, value] of Object.entries(translatedChunk)) {
            inputData[key] = value;
        }
    }

    // ✅ 원본 구조 그대로 저장 (주석 유지)
    fs.writeFileSync(outputPath, CJSON.stringify(inputData, null, 4), 'utf8');
    console.log('✅ 번역 완료! output.json에 저장됨.');
}

main();