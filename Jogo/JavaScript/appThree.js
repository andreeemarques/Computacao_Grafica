import { Jogo } from './src/Jogo.js';

let jogoAtual = null;

document.addEventListener('iniciarJogo', () => {
    if (jogoAtual) {
        jogoAtual.destruir();
    }
    jogoAtual = new Jogo();
});

document.addEventListener('voltarAoMenu', () => {
    if (jogoAtual) {
        jogoAtual.destruir();
        jogoAtual = null;
    }
});