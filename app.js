// Conteúdo completo substituto para app.js
document.addEventListener("DOMContentLoaded", () => {

    // --- HELPERS GLOBAIS ---
    const getEl = id => document.getElementById(id);
    const getVal = (id) => {
        const el = getEl(id);
        if (!el) return 0;
        return parseFloat(String(el.value || '').replace(',', '.')) || 0;
    };
    const getValStr = (id) => (getEl(id) && getEl(id).value) ? String(getEl(id).value) : '';
    const getTxt = (id) => (getEl(id) && getEl(id).innerText) ? String(getEl(id).innerText) : '';
    const fmt = (num, dec = 2) => {
        if (num === null || num === undefined || isNaN(Number(num))) {
            return (0).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
        }
        return Number(num).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    };
    const setTextSafe = (id, value) => {
        const el = getEl(id);
        if (el) el.innerText = value;
    };

    // Função de cálculo principal
    function calc() {
        try {
            const vel = getVal('velocidade');
            const prof = getVal('profundidade');
            const larg = getVal('largura');
            const calPct = getVal('cal_cimento_pct');
            const polimero = getVal('polimero_taxa');
            const pipa = getVal('vol_pipa');
            const peso = getVal('peso_especifico');
            const umid = getVal('umidade_pct');
            const meta = getVal('objetivo_dia');
            const largVia = getVal('largura_via');

            // Conversões / fórmulas
            const velMMin = (vel * 1000) / 60;         // km/h -> m/min (aprox)
            const volSolo = velMMin * prof * larg;     // m³/min
            const volCalM3 = peso * (calPct / 100);    // kg/m³
            const vazaoCal = volSolo * volCalM3;      // kg/min
            const prod = velMMin * larg;               // m²/min ou produto efetivo
            const taxaDist = prod > 0 ? vazaoCal / prod : 0;
            const bandeja = taxaDist / 4;

            const terraDia = meta * 1000 * largVia * prof; // m³ (meta em km -> *1000)
            const aguaM3 = peso * (umid / 100);            // L/m³ ? (mantive lógica original)
            const aguaDia = terraDia * aguaM3;
            const calDia = terraDia * volCalM3;
            const polimeroDia = terraDia * polimero;
            const polimeroPipa = aguaDia > 0 ? (pipa / aguaDia) * polimeroDia : 0;
            const vazaoBarra = volSolo * aguaM3;

            // Escrever resultados - usar setTextSafe para evitar erros se ID não existir
            setTextSafe('res_vol_solo', fmt(volSolo));
            setTextSafe('res_vol_cal_m3', fmt(volCalM3));
            setTextSafe('res_vol_cal_vel', fmt(vazaoCal));
            setTextSafe('res_vel_maquina', fmt(prod));
            // Alguns IDs aparentam variar entre res_vol_cal_m2 / m3 no repositório original.
            // Preenche ambos se existirem (compatibilidade).
            setTextSafe('res_vol_cal_m2', fmt(taxaDist));
            setTextSafe('res_bandeja', fmt(bandeja, 3));

            setTextSafe('res_vol_terra_dia', fmt(terraDia, 1));
            setTextSafe('res_vol_agua_m3', fmt(aguaM3));
            setTextSafe('res_vol_agua_dia', fmt(aguaDia, 0));
            setTextSafe('res_cal_dia', fmt(calDia, 0));
            setTextSafe('res_polimero_dia', fmt(polimeroDia));
            setTextSafe('res_polimero_pipa', fmt(polimeroPipa, 3));
            setTextSafe('res_polimero_agua_min', fmt(vazaoBarra));
        } catch (e) {
            console.error("Erro no cálculo:", e);
        }
    }

    // Funções de Botões / utilitários
    function getSequence() {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
        let storedDate = localStorage.getItem('lastPrintDate');
        let seq = 1;
        if (storedDate === today) seq = parseInt(localStorage.getItem('printSeq') || '0', 10) + 1;
        else localStorage.setItem('lastPrintDate', today);
        localStorage.setItem('printSeq', String(seq));
        return { date: today, seq: String(seq).padStart(3, '0') };
    }

    function imprimir() {
        calc(); // garante cálculo atualizado
        const info = getSequence();
        const idFull = `${info.date}.${info.seq}`;
        setTextSafe('print-id', idFull);
        setTextSafe('print-date', new Date().toLocaleString('pt-BR'));
        const originalTitle = document.title;
        document.title = idFull;
        window.print();
        document.title = originalTitle;
    }

    function compartilhar() {
        calc();
        // Mensagem montada com todos os parâmetros de entrada
        const message = `*RELATÓRIO DE OBRAS*\n📅 ${new Date().toLocaleString('pt-BR')}\n\n📌 *PARÂMETROS DE ENTRADA*\n` +
            `• Velocidade: ${getValStr('velocidade')} km/h\n` +
            `• Profundidade: ${getValStr('profundidade')} m\n` +
            `• Largura Máq.: ${getValStr('largura')} m\n` +
            `• Cal/Cimento: ${getValStr('cal_cimento_pct')} %\n` +
            `• Polímero: ${getValStr('polimero_taxa')} L/m³\n` +
            `• Vol. Pipa: ${getValStr('vol_pipa')} L\n` +
            `• Peso Esp.: ${getValStr('peso_especifico')} kg/m³\n` +
            `• Umidade Nec.: ${getValStr('umidade_pct')} %\n` +
            `• Meta do dia: ${getValStr('objetivo_dia')} km\n` +
            `• Largura via: ${getValStr('largura_via')} m\n\n` +
            `🔎 *RESULTADOS (selecionados)*\n` +
            `• Volume Solo: ${getTxt('res_vol_solo')} m³/min\n` +
            `• Vazão Cálc.: ${getTxt('res_vol_cal_vel')} kg/min\n` +
            `• Total Cimento/Dia: ${getTxt('res_cal_dia')} kg\n` +
            `• Total Polímero/Dia: ${getTxt('res_polimero_dia')} L\n`;

        // Copia para clipboard (se suportado) e exibe fallback
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(message).then(() => {
                alert('Relatório copiado para a área de transferência.');
            }).catch(err => {
                console.warn('Falha ao copiar:', err);
                prompt('Copie este relatório:', message);
            });
        } else {
            prompt('Copie este relatório:', message);
        }
    }

    function updateButtonState() {
        // Exemplo simples: desabilita botões em telas muito estreitas (ajuste conforme layout)
        const printBtn = getEl('btn-imprimir');
        const shareBtn = getEl('btn-compartilhar');
        const desktop = window.innerWidth > 640;
        if (printBtn) printBtn.disabled = !desktop;
        if (shareBtn) shareBtn.disabled = false; // permitir sempre compartilhar
    }

    // --- INICIALIZAÇÃO UNIFICADA ---
    function startApp() {
        // Replica logos (se houver)
        const splashImg = getEl('splash-logo');
        if (splashImg) {
            const printHeader = getEl('print-logo-img');
            if (printHeader) printHeader.src = splashImg.src;
        }

        // Estado do botão e cálculo inicial
        updateButtonState();
        calc();

        // Remove Splash Screen (Fade Out)
        const splash = getEl('splash-screen');
        if (splash) {
            splash.classList.add('fade-out');
            setTimeout(() => {
                splash.style.display = 'none';
            }, 600);
        }
    }

    // Listener Principal (para compatibilidade com imgs/Base64 etc)
    window.addEventListener('load', () => {
        setTimeout(startApp, 2000);
    });

    // Seleciona o conteúdo ao focar inputs
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('focus', function () { this.select(); });
    });

    // Expor funções importantes para que handlers inline e outros scripts funcionem
    window.calc = calc;
    window.imprimir = imprimir;
    window.compartilhar = compartilhar;
    window.getSequence = getSequence;
    window.updateButtonState = updateButtonState;

    // Ajuste ao redimensionar
    window.addEventListener('resize', updateButtonState);

});
