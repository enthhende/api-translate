# api-translate
perplexity ai api를 이용해서 json파일을 한글로 번역하는 nodejs 프로그램입니다.

nodejs 설치하고 node 실행이 가능해야 합니다.

perplexity api key가 필요합니다.
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
api-key.txt 이름의 파일을 만들고 본인의 perplexity api key를 넣고 저장하거나, 윈도우 파워쉘 명령어로 다음과 같이 입력합니다.
```bash
echo "본인의 api키" > api-key.txt
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
