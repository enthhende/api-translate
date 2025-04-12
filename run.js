const fs = require('fs');
const axios = require('axios');
const path = require('path');

// 🔐 API 키 불러오기
const API_KEY = fs.readFileSync(path.join(__dirname, 'api-key.txt'), 'utf8').trim();

// ⚙️ 설정 불러오기
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

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

    const prompt = `${USER_PROMPT}
    \n\n${JSON.stringify(batchJson, null, 2)}`;

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

        return JSON.parse(content);
    } catch (err) {
        console.error('❌ 번역 실패:', err.response?.data || err.message);
        return {};
    }
}

async function main() {
    console.log(API_KEY);

    const inputPath = './input.json';
    const outputPath = './output.json';

    const inputData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    const entries = Object.entries(inputData);
    const chunks = chunkArray(entries, BATCH_SIZE);

    let translatedData = {};

    for (let i = 0; i < chunks.length; i++) {
        console.log(`🔄 번역 중 (${i + 1}/${chunks.length})...`);
        const translatedChunk = await translateBatch(chunks[i]);
        translatedData = { ...translatedData, ...translatedChunk };
    }

    fs.writeFileSync(outputPath, JSON.stringify(translatedData, null, 4), 'utf8');
    console.log('✅ 번역 완료! output.json에 저장됨.');
}

main();