# api-translate
ai api를 이용해서 json파일을 한글로 번역하는 nodejs 프로그램입니다.

nodejs 설치하고 node 실행이 가능해야 합니다.

ai 모델의 api key가 필요합니다.
api-key.txt 파일을 읽어서 실행됩니다.

## 내려받기
git 에서 download.zip으로 다운받거나, 다음과 같은 명령어로 내려받습니다.
```bash
git clone https://github.com/enthhende/api-translate.git
```

## 이동
디렉토리로 이동합니다.
```bash
cd api-translate
```

## 모듈 설치
npm 모듈을 설치합니다.
```bash
npm install
```

## api key 추가
api-key.txt 이름의 파일을 만들고 본인의 api key를 넣고 저장합니다. txt파일 저장방식은 utf-8이어야 합니다.


## config.json 편집
"PROVIDER" 는 각 ai 의 이름입니다.
- [x] perplexity의 경우 perplexity 입니다
- [ ] GPT의 경우 GPT 입니다.
- [x] Gemini의 경우 gemini-2.0-flash 입니다.

"API_URL" 은 각 ai의 엔드포인트입니다.

- [x] perplexity의 경우 https://api.perplexity.ai/chat/completions 입니다.
- [ ] gpt의 경우 https://api.openai.com/v1/chat/completions 입니다.
- [x] Gemini 의 경우 https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent 입니다. 

"MODEL" 은 각 ai의 모델명입니다.
- [x] perplexity의 경우 sonar-pro를,
- [ ] gpt의 경우 gpt-4o나 gpt-3.5-turbo 등 사용하시는 모델을 적으십시오.
- [x] Gemini 는 예시로 든 gemini-2.0-flash 이외에도 여러가지가 있습니다.

"BATCH_SIZE" 는 한번에 처리하는 호출 수를 말합니다. 디폴트 10으로 되어 있습니다. 만약 번역하는 json 줄이 40줄이면 대략 4번 호출을 반복해서 처리한다는 뜻입니다. 예를 들어 100줄짜리 번역파일일 경우 50으로 설정하면 2번 호출해서 처리할 수 있습니다.

"USER_PROMPT" 번역시 명령 지침입니다. json 에 한국어로 번역하되, key와 json구조는 그대로 두고, 값(value)만 번역하도록 디폴트로 해두었습니다. 여러 줄로 정보를 입력할 시 문장끝에 콤마를 써서 입력합니다. 
예시:
```bash
 "USER_PROMPT": [
    "Translate the following JSON to Korean.",
    "Only translate the values, keep the keys and the JSON structure unchanged.",
    "Do not modify any comments—leave them exactly as they are.",
    "Return only valid JSON in your reply, without any explanation.",
    "Key and value must be enclosed in double quotation marks."
  ],
```

"SYSTEM_PROMPT" 는 번역시 참조할 정보를 줄 수 있습니다. ai가 번역시 필요한 정보(번역 문서에 관한 정보나 웹사이트 링크 etc...를 자유롭게 써서 기억시키고 번역에 참고하게 만들 수 있습니다.)

여러 줄로 정보를 입력할 시 문장 끝에 콤마를 써서 입력합니다. 
예시:
```bash
 "SYSTEM_PROMPT": [
 "You are a helpful translation assistant."
"Please refer to the following website https://ko.stardewvalleywiki.com/Stardew_Valley_Wiki when translating proper nouns and character names."
]
```

## 번역내용 추가
input.json 을 편집하여 번역할 내용을 넣습니다. 다음 내용은 예시입니다.
```json
{
    "title": "Hello World",
    "description": "This is a sample description."
}
```

## 실행
번역기를 실행합니다.
```bash
node run.js
```
