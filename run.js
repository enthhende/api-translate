const fs = require('fs');
const axios = require('axios');
const path = require('path');
const CJSON =  require('comment-json');
const os = require('os'); // ✅ 운영체제 개행 문자 처리용

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

    let inputText = fs.readFileSync(inputPath, 'utf8');

    let hasBom = false;
    if (inputText.charCodeAt(0) === 0xFEFF) {
        console.log('⚠️ BOM 감지됨 → 제거 후 저장 시 유지 예정');
        inputText = inputText.slice(1);
        hasBom = true; // ⚠️ 나중에 저장 시 다시 붙여줄 것
    }

    const lines = inputText.split(/\r?\n/); // ✅ 크로스 플랫폼 줄 나누기

    // 먼저 번역 대상 key-value 추출 (CJSON 그대로 사용)
    const inputData = CJSON.parse(inputText, null);
    const entries = Object.entries(inputData);
    const chunks = chunkArray(entries, BATCH_SIZE);

    let translatedMap = {};

    for (let i = 0; i < chunks.length; i++) {
        console.log(`🔄 번역 중 (${i + 1}/${chunks.length})...`);
        const translatedChunk = await translateBatch(chunks[i]);
        // console.log('✅ 번역 결과:', translatedChunk);
        Object.assign(translatedMap, translatedChunk);
    }

    for (const [key] of entries) {
        if (!translatedMap.hasOwnProperty(key)) {
            console.warn(`⚠️ 번역 누락된 키: "${key}"`);
        }
    }

    // 🔄 줄마다 키가 있는 경우 value만 교체
    const keyValueRegex = /^(\s*)"([^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"\s*(,?)\s*(\/\/.*)?$/;


    const updatedLines = lines.map(line => {
        const match = line.match(keyValueRegex);
        if (!match) return line; // ❗ 매치되지 않는 줄은 절대 건드리지 않음 (공백 포함 줄 포함)
    
        const indent = match[1];
        const key = match[2];
        const oldVal = match[3];
        const comma = match[4] || '';
        const comment = match[5] || '';
    
        if (!translatedMap.hasOwnProperty(key)) return line; // ❗ 번역 결과 없으면 원본 유지
    
        const newVal = translatedMap[key].replace(/"/g, '\\"'); // 이스케이프 처리
        return `${indent}"${key}": "${newVal}"${comma}${comment ? ' ' + comment : ''}`;
    });

    // 2. 저장 시 BOM 여부 반영
    const outputText = updatedLines.join(os.EOL);
    const finalOutput = hasBom ? '\uFEFF' + outputText : outputText;

    fs.writeFileSync(outputPath, finalOutput, 'utf8');

    console.log('✅ 주석과 빈 줄까지 유지된 번역 결과가 output.json에 저장됨.');
}

main();