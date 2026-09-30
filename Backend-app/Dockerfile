FROM node:18-alpine

# Install LibreOffice headless for DOCX → PDF conversion + Thai font support
RUN apk add --no-cache \
    libreoffice \
    openjdk17-jre-headless \
    ttf-freefont \
    font-noto-thai \
    fontconfig \
    && wget -qO /usr/share/fonts/Sarabun-Regular.ttf https://github.com/google/fonts/raw/main/ofl/sarabun/Sarabun-Regular.ttf \
    && wget -qO /usr/share/fonts/Sarabun-Bold.ttf https://github.com/google/fonts/raw/main/ofl/sarabun/Sarabun-Bold.ttf \
    && wget -qO /usr/share/fonts/Sarabun-Italic.ttf https://github.com/google/fonts/raw/main/ofl/sarabun/Sarabun-Italic.ttf \
    && wget -qO /usr/share/fonts/Sarabun-BoldItalic.ttf https://github.com/google/fonts/raw/main/ofl/sarabun/Sarabun-BoldItalic.ttf

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Setup fontconfig mapping for TH SarabunPSK -> Sarabun
RUN cp /app/config/th-sarabun-alias.conf /etc/fonts/conf.d/99-th-sarabun.conf \
    && fc-cache -f

EXPOSE 3000