# Node.js 기반 Express 앱
FROM node:18

# 작업 디렉토리 지정
WORKDIR /app

# package.json 복사 후 설치
COPY package*.json ./
RUN npm install

# 앱 소스 복사
COPY . .

# 환경 변수
ENV NODE_ENV=production
EXPOSE 3000

# 서버 실행
CMD ["npm", "start"]