FROM node:20-slim

# Install necessary dependencies for Puppeteer and TypeScript
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && mkdir -p /etc/apt/sources.list.d \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Initialize npm project and install dependencies
RUN npm init -y \
    && npm install typescript @types/node ts-node puppeteer axios \
    && npm install -g typescript ts-node

# Copy tsconfig first
COPY tsconfig.json .

# Create directories for scraped data
RUN mkdir -p scraped_texts scraped_images dist

# Add non-root user
RUN groupadd -r task1 && useradd -r -g task1 -G audio,video task1 \
    && mkdir -p /home/task1/Downloads \
    && chown -R task1:task1 /home/task1 \
    && chown -R task1:task1 /usr/src/app \
    && chown -R task1:task1 /usr/src/app/dist

# Copy the task script
COPY task_1.ts .

# Compile TypeScript
RUN chown task1:task1 task_1.ts && \
    su task1 -c "tsc"

USER task1

CMD ["node", "dist/task_1.js"]