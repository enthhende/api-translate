const fs = require('fs');
const axios = require('axios');

const API_KEY = ''; // ← 여기에 본인 API 키 입력
const API_URL = 'https://api.perplexity.ai/chat/completions';
const MODEL = 'sonar-pro';
const BATCH_SIZE = 10;
const USER_PROMPT = `Translate the following JSON to Korean. 
    Only translate the values, keep the keys and the JSON structure unchanged. 
    Return only valid JSON in your reply, without any explanation.`;
const SYSTEM_PROMPT = `You are a helpful translation assistant.`;

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