export class UILuzes {
    constructor(gestorLuzes) {
        this.gestor = gestorLuzes;
        this._construirUI();
    }

    _construirUI() {
        this.painel = document.createElement('div');
        const painel = this.painel;
        painel.id = 'painel-luzes';
        painel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0,0,0,0.75);
            border: 1px solid rgba(0,255,65,0.4);
            padding: 16px;
            font-family: 'Share Tech Mono', monospace;
            font-size: 12px;
            color: #00ff41;
            z-index: 500;
            min-width: 200px;
            user-select: none;
        `;

        const titulo = document.createElement('div');
        titulo.textContent = '// LUZES';
        titulo.style.cssText = `
            letter-spacing: 4px;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(0,255,65,0.25);
        `;
        painel.appendChild(titulo);

        const luzes = [
            { nome: 'ambiente',    label: 'Ambiente',        tipo: 'simples' },
            { nome: 'direcional',  label: 'Direcional (Sol)', tipo: 'simples' },
            { nome: 'hemisferica', label: 'Hemisférica',      tipo: 'simples' },
            { nome: 'postes',      label: 'Postes (Point)',   tipo: 'postes'  },
        ];

        luzes.forEach(({ nome, label, tipo }) => {
            const linha = document.createElement('div');
            linha.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                margin-bottom: 8px;
                cursor: pointer;
            `;

            const texto = document.createElement('span');
            texto.textContent = label;

            const toggle = document.createElement('span');
            toggle.style.cssText = `
                border: 1px solid;
                padding: 2px 6px;
                font-size: 10px;
                letter-spacing: 1px;
                min-width: 48px;
                text-align: center;
            `;

            const atualizar = () => {
                const ligada = tipo === 'postes'
                    ? this.gestor.postesLigados()
                    : this.gestor.estaLigada(nome);
                toggle.textContent = ligada ? '[ ON ]' : '[ OFF ]';
                toggle.style.color = ligada ? '#00ff41' : 'rgba(0,255,65,0.3)';
                toggle.style.borderColor = ligada
                    ? 'rgba(0,255,65,0.5)'
                    : 'rgba(0,255,65,0.15)';
                texto.style.color = ligada
                    ? 'rgba(0,255,65,0.8)'
                    : 'rgba(0,255,65,0.3)';
            };

            linha.addEventListener('click', (e) => {
                e.stopPropagation();
                if (tipo === 'postes') {
                    this.gestor.alternarPostes();
                } else {
                    this.gestor.alternar(nome);
                }
                atualizar();
            });

            linha.appendChild(texto);
            linha.appendChild(toggle);
            painel.appendChild(linha);

            // Reflete o estado inicial definido no menu em vez de assumir sempre ON
            atualizar();
        });

        document.body.appendChild(painel);
    }
}