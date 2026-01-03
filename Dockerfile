FROM node:20-bullseye

# ffmpeg + python3 + pip pre-installed
RUN apt update && apt install -y ffmpeg python3-pip
RUN pip3 install -U yt-dlp

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .

CMD ["node", "server.js"]
