FROM node:22

RUN apt-get update && apt-get install -y ffmpeg python3-pip
RUN pip3 install -U yt-dlp

WORKDIR /app
COPY package.json ./
RUN npm install

COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
