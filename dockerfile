FROM oven/bun:1

WORKDIR /usr/src/app

COPY . .

RUN bun install

EXPOSE 3000
EXPOSE 3001

CMD bun run build && bun run dev
