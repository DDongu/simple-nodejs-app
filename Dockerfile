# Node.js 공식 이미지 사용
FROM node:18

# 작업 디렉터리 설정
WORKDIR /usr/src/app

#  package.json package-lock.json 파일 복사 후 종속성 설치
COPY package.json package-lock.json ./
RUN npm install

# 사용할 애플리케이션 코드 복사
COPY app.js .

# 환경 변수 설정 (개별 설정은 docker-compose에서 수행)
ENV NODE_ENV=production

# 개방할 포트
EXPOSE 3000

# 컨테이너 실행 시 기본으로 실행할 명령어 (어플리케이션 실행)
CMD ["npm", "start"]