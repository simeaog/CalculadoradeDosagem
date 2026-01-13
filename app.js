document.addEventListener("DOMContentLoaded", () => {

        // --- FUNÇÕES GLOBAIS (Carregadas primeiro) ---
        const getVal = (id) => {
            const el = document.getElementById(id);
            if (!el) return 0;
            return parseFloat(el.value.replace(',', '.')) || 0;
        };
        const getValStr = (id) => document.getElementById(id).value;
        const getTxt = (id) => document.getElementById(id).innerText;
        const fmt = (num, dec=2) => {
            if (isNaN(num)) return "0,00";
            return num.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
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

                const velMMin = (vel * 1000) / 60;
                const volSolo = velMMin * prof * larg;
                const volCalM3 = peso * (calPct / 100);
                const vazaoCal = volSolo * volCalM3;
                const prod = velMMin * larg;
                const taxaDist = prod > 0 ? vazaoCal / prod : 0;
                const bandeja = taxaDist / 4;

                const terraDia = meta * 1000 * largVia * prof;
                const aguaM3 = peso * (umid / 100);
                const aguaDia = terraDia * aguaM3;
                const calDia = terraDia * volCalM3;
                const polimeroDia = terraDia * polimero;
                const polimeroPipa = aguaDia > 0 ? (pipa / aguaDia) * polimeroDia : 0;
                const vazaoBarra = volSolo * aguaM3;

                document.getElementById('res_vol_solo').innerText = fmt(volSolo);
                document.getElementById('res_vol_cal_m3').innerText = fmt(volCalM3);
                document.getElementById('res_vol_cal_vel').innerText = fmt(vazaoCal);
                document.getElementById('res_vel_maquina').innerText = fmt(prod);
                document.getElementById('res_vol_cal_m2').innerText = fmt(taxaDist);
                document.getElementById('res_bandeja').innerText = fmt(bandeja, 3);
                
                document.getElementById('res_vol_terra_dia').innerText = fmt(terraDia, 1);
                document.getElementById('res_vol_agua_m3').innerText = fmt(aguaM3);
                document.getElementById('res_vol_agua_dia').innerText = fmt(aguaDia, 0);
                document.getElementById('res_cal_dia').innerText = fmt(calDia, 0);
                document.getElementById('res_polimero_dia').innerText = fmt(polimeroDia);
                document.getElementById('res_polimero_pipa').innerText = fmt(polimeroPipa, 3);
                document.getElementById('res_polimero_agua_min').innerText = fmt(vazaoBarra);
            } catch (e) {
                console.error("Erro no cálculo:", e);
            }
        }

        // Funções de Botões
        function getSequence() {
            const today = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
            let storedDate = localStorage.getItem('lastPrintDate');
            let seq = 1;
            if (storedDate === today) seq = parseInt(localStorage.getItem('printSeq') || 0) + 1;
            else localStorage.setItem('lastPrintDate', today);
            localStorage.setItem('printSeq', seq);
            return { date: today, seq: seq.toString().padStart(3, '0') };
        }

        function imprimir() {
            calc(); // Garante cálculo antes de imprimir
            const info = getSequence();
            const idFull = `${info.date}.${info.seq}`;
            document.getElementById('print-id').innerText = idFull;
            document.getElementById('print-date').innerText = new Date().toLocaleString('pt-BR');
            const originalTitle = document.title;
            document.title = idFull; 
            window.print();
            document.title = originalTitle;
        }

        function compartilhar() {
            calc();
            const message = `*RELATÓRIO DE OBRAS*\n📅 ${new Date().toLocaleString('pt-BR')}\n\n📌 *PARÂMETROS DE ENTRADA*\n• Velocidade: ${getValStr('velocidade')} km/h\n• Profundidade: ${getValStr('profundidade')} m\n• Largura Máq.: ${getValStr('largura')} m\n• Cal/Cimento: ${getValStr('cal_cimento_pct')} %\n• Polímero: ${getValStr('polimero_taxa')} L/m³\n• Vol. Pipa: ${getValStr('vol_pipa')} L\n• Peso Esp.: ${getValStr('peso_especifico')} kg/m³\n• Umidade Nec.: ${getValStr('umidade_pct')} %\n• Meta do dia: ${getValStr('objetivo_dia')} km\n• Largura via: ${getValStr('largura_via')} m\n\n🏗️ *CAL / CIMENTO*\n• Vol. Solo: ${getTxt('res_vol_solo')} m³/min\n• Vol. Cal/Cimento: ${getTxt('res_vol_cal_m3')} kg/m³\n• Vazão Nec.: ${getTxt('res_vol_cal_vel')} kg/min\n• Velocidade Máq.: ${getTxt('res_vel_maquina')} m²/min\n• Taxa Distrib.: ${getTxt('res_vol_cal_m2')} kg/m²\n• Teste Bandeja: ${getTxt('res_bandeja')} kg\n\n💧 *POLÍMERO + ÁGUA*\n• Terra (Dia): ${getTxt('res_vol_terra_dia')} m³\n• Taxa Água: ${getTxt('res_vol_agua_m3')} L/m³\n• Total Água: ${getTxt('res_vol_agua_dia')} L\n• Total Cimento: ${getTxt('res_cal_dia')} kg\n• Total Polímero: ${getTxt('res_polimero_dia')} L\n• Polímero/Pipa: ${getTxt('res_polimero_pipa')} L\n• Vazão Barra: ${getTxt('res_polimero_agua_min')} L/min`;

            const isDesktop = window.innerWidth >= 900;
            if (!isDesktop && navigator.share) {
                navigator.share({ title: 'Relatório Completo', text: message }).catch((error) => console.log('Erro share', error));
            } else {
                navigator.clipboard.writeText(message).then(() => {
                    const t = document.getElementById("toast");
                    t.innerText = isDesktop ? "Relatório copiado!" : "Copiado para área de transferência!";
                    t.className = "show";
                    setTimeout(() => t.className = t.className.replace("show", ""), 3000);
                });
            }
        }

        function updateButtonState() {
            const isDesktop = window.innerWidth >= 900;
            const btnText = document.getElementById('text-share');
            const btnIcon = document.getElementById('icon-share');
            if (isDesktop) {
                btnText.innerText = "COPIAR";
                btnIcon.innerHTML = '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>';
            } else {
                btnText.innerText = "COMPARTILHAR";
                btnIcon.innerHTML = '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>';
            }
        }

        // --- INICIALIZAÇÃO UNIFICADA ---
        function startApp() {
            // 1. Replica logos
            const splashImg = document.getElementById('splash-logo');
            if (splashImg) {
                const printHeader = document.getElementById('print-logo-img');
                if (printHeader) printHeader.src = splashImg.src;
            }
            
            // 2. Define estado do botão
            updateButtonState();

            // 3. Executa cálculo inicial
            calc();

            // 4. Remove Splash Screen (Fade Out)
            const splash = document.getElementById('splash-screen');
            if (splash) {
                splash.classList.add('fade-out');
                setTimeout(() => splash.style.display = 'none', 600);
            }
        }

        // Listener Principal (Dispara apenas uma vez)
        window.addEventListener('load', () => {
            // Pequeno delay para garantir que Base64 carregou visualmente
            setTimeout(startApp, 2000);
        });

        // Listeners de UI
        document.querySelectorAll('input').forEach(input => {
            input.addEventListener('focus', function() { this.select(); });
        });
        window.addEventListener('resize', updateButtonState);

});
