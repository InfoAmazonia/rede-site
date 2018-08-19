# Instalação e desenvolvimento

Passos para instalar e iniciar o serviço localmente.

## Pré-requisitos

Para configurar uma instalação deste serviço, instale as seguintes dependências em seu sistema:

- [Git](https://git-scm.com)
- [Node.js](http://nodejs.org) 8 ou superior
- [Docker](http://docker.com/)

## Inicialização

[Clone o repositório](https://help.github.com/articles/cloning-a-repository/) localmente e inicie a instância de desensolvimento do MongoDB:

    docker-compose -f docker-compose-dev.yml up

Instale as dependências:

    npm install

Inicie o serviço:

    npm start

Acesse o web app: http://localhost:3000.

## Desenvolvimento

Para reiniciar o servidor quando há mudanças do código-fonte:

    npm run watch-server

O mesmo para o código do web app:

    npm run watch-webapp

Acesse o web app: http://localhost:3000.

Caso precise criar um build do web app para produção:

    npm run build-webapp
