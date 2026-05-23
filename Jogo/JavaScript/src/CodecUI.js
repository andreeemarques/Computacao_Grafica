// CodecUI.js — Interface Codec estilo Metal Gear Solid

export class CodecUI {
    constructor() {
        this._container = null;
        this._textoEl = null;
        this._nomeEl = null;
        this._retratoEl = null;
        this._intervaloTexto = null;
        this._onFimDialogo = null;
        this._filaDialogos = [];
        this._ativo = false;

        this._criarUI();
        this._injetarEstilos();
    }

    _injetarEstilos() {
        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

            #codec-container {
                display: none;
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                z-index: 500;
                font-family: 'Share Tech Mono', 'Courier New', monospace;
                animation: codecEntrar 0.3s ease-out;
            }

            @keyframes codecEntrar {
                from { transform: translateY(100%); opacity: 0; }
                to   { transform: translateY(0);    opacity: 1; }
            }

            @keyframes codecSair {
                from { transform: translateY(0);    opacity: 1; }
                to   { transform: translateY(100%); opacity: 0; }
            }

            #codec-container.a-fechar {
                animation: codecSair 0.3s ease-in forwards;
            }

            /* Barra de frequência no topo */
            #codec-frequencia {
                background: #000;
                border-top: 1px solid #0f0;
                color: #0f0;
                font-size: 11px;
                padding: 3px 16px;
                display: flex;
                justify-content: space-between;
                letter-spacing: 2px;
                opacity: 0.85;
            }

            #codec-frequencia::before {
                content: '── CODEC ──';
                color: #0a0;
            }

            /* Painel principal */
            #codec-painel {
                background: linear-gradient(180deg, #0a0a0a 0%, #000 100%);
                border-top: 2px solid #0f0;
                display: grid;
                grid-template-columns: 110px 1fr 110px;
                min-height: 110px;
                position: relative;
                overflow: hidden;
            }

            /* Linhas de scan CRT */
            #codec-painel::after {
                content: '';
                position: absolute;
                inset: 0;
                background: repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(0,255,0,0.02) 2px,
                    rgba(0,255,0,0.02) 4px
                );
                pointer-events: none;
            }

            /* Retrato */
            .codec-retrato {
                border-right: 1px solid #1a1a1a;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 10px;
                position: relative;
            }

            .codec-retrato-canvas {
                width: 80px;
                height: 80px;
                border: 1px solid #0f0;
                image-rendering: pixelated;
                filter: brightness(0.9) contrast(1.1);
            }

            .codec-retrato-nome {
                color: #0f0;
                font-size: 9px;
                letter-spacing: 1px;
                margin-top: 5px;
                text-align: center;
                text-transform: uppercase;
            }

            /* Área de texto */
            #codec-texto-area {
                padding: 14px 18px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                position: relative;
            }

            #codec-nome-falante {
                color: #0f0;
                font-size: 11px;
                letter-spacing: 3px;
                text-transform: uppercase;
                margin-bottom: 8px;
                opacity: 0.8;
            }

            #codec-texto {
                color: #c8f5c8;
                font-size: 14px;
                line-height: 1.6;
                min-height: 48px;
                text-shadow: 0 0 8px rgba(0,255,0,0.4);
            }

            /* Indicador "carregar para continuar" */
            #codec-continuar {
                position: absolute;
                bottom: 10px;
                right: 18px;
                color: #0f0;
                font-size: 10px;
                letter-spacing: 1px;
                opacity: 0;
                animation: piscar 0.8s infinite;
                transition: opacity 0.3s;
            }

            #codec-continuar.visivel {
                opacity: 1;
            }

            @keyframes piscar {
                0%, 100% { opacity: 1; }
                50%       { opacity: 0.2; }
            }

            /* Retrato direito (quem ouve) */
            #codec-retrato-direito {
                border-left: 1px solid #1a1a1a;
            }

            /* Ecrã preto */
            #ecra-preto {
                position: fixed;
                inset: 0;
                background: #000;
                z-index: 2000;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.6s ease;
            }

            #ecra-preto.visivel {
                opacity: 1;
                pointer-events: all;
            }

            /* Missão concluída */
            #missao-concluida {
                display: none;
                position: fixed;
                inset: 0;
                background: #000;
                z-index: 3000;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-family: 'Share Tech Mono', monospace;
            }

            #missao-concluida-texto {
                color: #0f0;
                font-size: 42px;
                letter-spacing: 12px;
                text-transform: uppercase;
                text-shadow: 0 0 30px rgba(0,255,0,0.8);
                opacity: 0;
                transform: scaleX(1.4);
                transition: all 1.2s ease;
            }

            #missao-concluida-sub {
                color: #0a0;
                font-size: 13px;
                letter-spacing: 6px;
                margin-top: 16px;
                opacity: 0;
                transition: opacity 1s ease 0.8s;
            }

            #missao-concluida.ativo #missao-concluida-texto {
                opacity: 1;
                transform: scaleX(1);
            }

            #missao-concluida.ativo #missao-concluida-sub {
                opacity: 0.6;
            }
        `;
        document.head.appendChild(style);
    }

    _criarUI() {
        // Ecrã preto (fade in/out)
        const ecraPerto = document.createElement('div');
        ecraPerto.id = 'ecra-preto';
        document.body.appendChild(ecraPerto);

        // Missão concluída
        const missao = document.createElement('div');
        missao.id = 'missao-concluida';
        missao.innerHTML = `
            <div id="missao-concluida-texto">MISSÃO CONCLUÍDA</div>
            <div id="missao-concluida-sub">[ PRIMA QUALQUER TECLA ]</div>
        `;
        document.body.appendChild(missao);

        // Container principal do Codec
        const container = document.createElement('div');
        container.id = 'codec-container';
        container.innerHTML = `
            <div id="codec-frequencia">
                <span id="codec-freq-num">140.85</span>
                <span>CODEC COMM</span>
                <span id="codec-hora">--:--</span>
            </div>
            <div id="codec-painel">
                <div class="codec-retrato" id="codec-retrato-esq">
                    <canvas class="codec-retrato-canvas" id="canvas-retrato-esq" width="80" height="80"></canvas>
                    <div class="codec-retrato-nome" id="codec-nome-esq">—</div>
                </div>
                <div id="codec-texto-area">
                    <div id="codec-nome-falante">—</div>
                    <div id="codec-texto"></div>
                    <div id="codec-continuar">▼ CONTINUAR</div>
                </div>
                <div class="codec-retrato" id="codec-retrato-dir">
                    <canvas class="codec-retrato-canvas" id="canvas-retrato-dir" width="80" height="80"></canvas>
                    <div class="codec-retrato-nome" id="codec-nome-dir">—</div>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        this._container = container;
        this._textoEl = document.getElementById('codec-texto');
        this._nomeEl = document.getElementById('codec-nome-falante');
        this._continuarEl = document.getElementById('codec-continuar');

        // Desenha retratos pixel art simples
        this._desenharRetratoGeneral(document.getElementById('canvas-retrato-esq'));
        this._desenharRetratoViper(document.getElementById('canvas-retrato-dir'));
        document.getElementById('codec-nome-esq').textContent = 'General';
        document.getElementById('codec-nome-dir').textContent = 'Viper';

        // Hora actual
        this._atualizarHora();
    }

    _atualizarHora() {
        const el = document.getElementById('codec-hora');
        if (el) {
            const now = new Date();
            el.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        }
    }

    // Retrato pixel art do General
    _desenharRetratoGeneral(canvas) {
        const ctx = canvas.getContext('2d');
        const W = 80, H = 80;
        ctx.fillStyle = '#0a1a0a';
        ctx.fillRect(0, 0, W, H);

        // Scanlines
        for (let y = 0; y < H; y += 4) {
            ctx.fillStyle = 'rgba(0,255,0,0.03)';
            ctx.fillRect(0, y, W, 2);
        }

        const g = (x, y, w, h, cor) => {
            ctx.fillStyle = cor;
            ctx.fillRect(x, y, w, h);
        };

        // Farda (corpo)
        g(15, 45, 50, 35, '#1a3a1a');
        // Ombros / medalhas
        g(12, 45, 12, 8, '#2a5a2a');
        g(56, 45, 12, 8, '#2a5a2a');
        // Pescoço
        g(32, 38, 16, 10, '#c8a882');
        // Cabeça
        g(24, 12, 32, 28, '#c8a882');
        // Boné
        g(20, 8,  40, 10, '#1a3a1a');
        g(18, 14, 44, 4,  '#1a3a1a');
        // Olhos
        g(30, 22, 6, 4, '#3a2a1a');
        g(44, 22, 6, 4, '#3a2a1a');
        // Boca
        g(32, 32, 16, 3, '#8a6050');
        // Bigode
        g(28, 28, 24, 3, '#5a4030');
        // Estrelas no boné
        g(36, 9, 4, 4, '#d4a000');
        g(42, 9, 4, 4, '#d4a000');

        // Vinheta
        const grad = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, 50);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
    }

    // Retrato pixel art da Viper
    _desenharRetratoViper(canvas) {
        const ctx = canvas.getContext('2d');
        const W = 80, H = 80;
        ctx.fillStyle = '#0a1a0a';
        ctx.fillRect(0, 0, W, H);

        for (let y = 0; y < H; y += 4) {
            ctx.fillStyle = 'rgba(0,255,0,0.03)';
            ctx.fillRect(0, y, W, 2);
        }

        const g = (x, y, w, h, cor) => {
            ctx.fillStyle = cor;
            ctx.fillRect(x, y, w, h);
        };

        // Fato táctico
        g(18, 50, 44, 30, '#1a2a1a');
        // Gola alta
        g(28, 42, 24, 12, '#111a11');
        // Pescoço
        g(33, 36, 14, 10, '#c8a882');
        // Cabeça (ligeiramente mais oval/feminina)
        g(25, 12, 30, 26, '#c8a882');
        // Cabelo escuro curto/médio
        g(22, 8,  36, 12, '#1a0a0a');
        g(20, 14, 6,  16, '#1a0a0a'); // lateral esq
        g(54, 14, 6,  16, '#1a0a0a'); // lateral dir
        // Franja
        g(24, 14, 32, 5, '#1a0a0a');
        // Olhos amendoados
        g(30, 22, 7, 3, '#2a3a4a');
        g(43, 22, 7, 3, '#2a3a4a');
        // Sobrancelhas finas
        g(29, 19, 9, 2, '#1a0a0a');
        g(42, 19, 9, 2, '#1a0a0a');
        // Nariz fino
        g(38, 28, 4, 3, '#b08868');
        // Boca
        g(32, 33, 16, 3, '#9a5050');
        // Cicatriz (toque táctico)
        g(47, 25, 2, 8, '#a07060');

        const grad = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, 50);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
    }

    // ── API pública ──────────────────────────────────────────

    mostrarEcraPreto(visivel) {
        const el = document.getElementById('ecra-preto');
        if (visivel) el.classList.add('visivel');
        else         el.classList.remove('visivel');
    }

    mostrarMissaoConcluida(onFim) {
        const el = document.getElementById('missao-concluida');
        el.style.display = 'flex';
        setTimeout(() => el.classList.add('ativo'), 100);

        const fechar = () => {
            el.style.display = 'none';
            el.classList.remove('ativo');
            document.removeEventListener('keydown', fechar);
            if (onFim) onFim();
        };
        setTimeout(() => document.addEventListener('keydown', fechar), 2000);
    }

    // Inicia sequência de diálogos
    // dialogos: [{ falante: 'General'|'Snake', texto: '...' }, ...]
    iniciarDialogos(dialogos, onFim) {
        this._filaDialogos = [...dialogos];
        this._onFimDialogo = onFim;
        this._ativo = true;
        this._container.style.display = 'block';
        this._atualizarHora();
        this._mostrarProximoDialogo();

        // Click ou tecla para avançar
        this._onAvancar = (e) => {
            if (!this._ativo) return;
            if (e.type === 'keydown' && !['Enter', ' ', 'F'].includes(e.key)) return;
            this._avancarDialogo();
        };
        document.addEventListener('keydown', this._onAvancar);
        document.addEventListener('click',   this._onAvancar);
    }

    _mostrarProximoDialogo() {
        if (this._filaDialogos.length === 0) {
            this._terminarDialogos();
            return;
        }

        const { falante, texto } = this._filaDialogos.shift();
        this._nomeEl.textContent = falante.toUpperCase();
        this._continuarEl.classList.remove('visivel');

        // Destaca o retrato do falante
        const esq = document.getElementById('codec-retrato-esq');
        const dir = document.getElementById('codec-retrato-dir');
        if (falante.toLowerCase() === 'general') {
            esq.style.filter = 'brightness(1.0)';
            dir.style.filter = 'brightness(0.4)';
            document.getElementById('canvas-retrato-esq').style.boxShadow = '0 0 12px rgba(0,255,0,0.6)';
            document.getElementById('canvas-retrato-dir').style.boxShadow = 'none';
        } else {
            esq.style.filter = 'brightness(0.4)';
            dir.style.filter = 'brightness(1.0)';
            document.getElementById('canvas-retrato-esq').style.boxShadow = 'none';
            document.getElementById('canvas-retrato-dir').style.boxShadow = '0 0 12px rgba(0,255,0,0.6)';
        }

        this._escreverLetraALetra(texto, 30);
    }

    _escreverLetraALetra(texto, msPorLetra) {
        if (this._intervaloTexto) clearInterval(this._intervaloTexto);
        this._textoEl.textContent = '';
        this._textoCompleto = texto;
        this._textoEscrito = false;
        let i = 0;

        this._intervaloTexto = setInterval(() => {
            this._textoEl.textContent += texto[i++];
            if (i >= texto.length) {
                clearInterval(this._intervaloTexto);
                this._intervaloTexto = null;
                this._textoEscrito = true;
                this._continuarEl.classList.add('visivel');
            }
        }, msPorLetra);
    }

    _avancarDialogo() {
        // Se o texto ainda está a escrever, mostra tudo de uma vez
        if (!this._textoEscrito) {
            if (this._intervaloTexto) clearInterval(this._intervaloTexto);
            this._textoEl.textContent = this._textoCompleto;
            this._textoEscrito = true;
            this._continuarEl.classList.add('visivel');
            return;
        }

        // Avança para o próximo
        this._mostrarProximoDialogo();
    }

    _terminarDialogos() {
        this._ativo = false;
        document.removeEventListener('keydown', this._onAvancar);
        document.removeEventListener('click',   this._onAvancar);

        this._container.classList.add('a-fechar');
        setTimeout(() => {
            this._container.style.display = 'none';
            this._container.classList.remove('a-fechar');
            if (this._onFimDialogo) this._onFimDialogo();
        }, 300);
    }

    destruir() {
        this._container?.remove();
        document.getElementById('ecra-preto')?.remove();
        document.getElementById('missao-concluida')?.remove();
        document.querySelectorAll('style').forEach(s => {
            if (s.textContent.includes('codec-container')) s.remove();
        });
    }
}