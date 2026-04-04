

    const supabaseUrl = 'https://vxtefnajeqwwditdwwcs.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dGVmbmFqZXF3d2RpdGR3d2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0Mzc5MjEsImV4cCI6MjA4NDAxMzkyMX0.HFURBIenpBqaqkiF-CGsdBoTTqhdqFznDU8ntITnIWY';
    const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

    const ADMIN_WHATSAPP = '59163151497';
    let currentUser = { id: null, nombre: '' };
    let selectedItems = new Set();
    let allProducts = [];
    let selectedWaiter = null;

    async function getUserCredential(usuarioId) {
        const { data, error } = await supabaseClient
            .from('credenciales_biometricas')
            .select('*')
            .eq('usuario_id', usuarioId)
            .single();

        if (error) {
            return null;
        }

        return data;
    }


    const USERS = [
        { id: 1, name: "Luis Jeri", initial: "LJ" },
        { id: 2, name: "Leo Peter", initial: "LP" },
        { id: 3, name: "Horacio Arenas", initial: "HA" },
        { id: 4, name: "Diego Cardenas", initial: "DC" },
        { id: 5, name: "Chris", initial: "CH" },
        { id: 6, name: "Tere", initial: "TR" },
        { id: 7, name: "Angie", initial: "AZ" }
    ];

    const WAITERS = [
        { id: 1, name: "William", initial: "W" },
        { id: 2, name: "Angelica", initial: "A" },
        { id: 3, name: "Gabriel", initial: "G" },
        { id: 4, name: "Joel", initial: "J" }
    ];
const BARS = [
    { id: 1, name: "Principal" },
    { id: 2, name: "Cholet" }
];

let selectedBar = null;
    async function loadProducts() {
        try {
            const { data, error } = await supabaseClient.from('productos').select('*');
            if (error) throw error;
            allProducts = data;
            renderProducts();
        } catch (err) {
            console.error('Error loading products:', err);
            renderProducts();
        }
    }
function renderBars() {
    const grid = document.getElementById('barGrid');

    grid.innerHTML = BARS.map(b => `
      <div class="waiter-card ${selectedBar?.id === b.id ? 'selected highlight-bar' : ''}" onclick="selectBar(${b.id})">
          <div class="flex-1">
              <p class="text-sm font-bold text-white">${b.name}</p>
          </div>
          ${selectedBar?.id === b.id ? '<span class="text-green-400 font-bold">✔ Seleccionada</span>' : ''}
      </div>
    `).join('');
}

function selectBar(id) {
    selectedBar = BARS.find(b => b.id === id);
    renderBars();
    checkConfirmButton();
}

function selectWaiter(id) {
    selectedWaiter = WAITERS.find(w => w.id === id);
    renderWaiters();

    const barSection = document.getElementById('barSection');

    // 👇 primero hacerlo visible
    barSection.classList.remove('hidden');

    // 👇 estado inicial (invisible)
    barSection.classList.add('opacity-0', 'translate-y-3');

    // 👇 forzar render (CLAVE)
    barSection.offsetHeight;

    // 👇 animar entrada
    barSection.classList.remove('opacity-0', 'translate-y-3');
    // activar botón si ya hay barra
    if (selectedWaiter && selectedBar) {
        document.getElementById('finalConfirmBtn').disabled = false;
    }

    if (window.navigator.vibrate) window.navigator.vibrate(10);
}
function toggleNotaInput() {
    const box = document.getElementById('notaInputBox');

    if (box.classList.contains('hidden')) {
        box.classList.remove('hidden');

        // animación entrada
        box.classList.add('opacity-0', 'translate-y-2');
        box.offsetHeight;
        box.classList.remove('opacity-0', 'translate-y-2');

    } else {
        box.classList.add('opacity-0', 'translate-y-2');

        setTimeout(() => {
            box.classList.add('hidden');
        }, 300);
    }
}
function checkConfirmButton() {
    const btn = document.getElementById('finalConfirmBtn');
    btn.disabled = !(selectedBar && selectedWaiter);
}
    function showErrorToast(message) {
        const toast = document.getElementById('errorToast');
        const text = document.getElementById('errorToastMessage');

        text.textContent = message;

        toast.classList.add('active');
        if (window.navigator.vibrate) window.navigator.vibrate([20, 40, 20]);

        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    }

    function getDeviceId() {
        let id = localStorage.getItem('device_id');
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem('device_id', id);
        }
        return id;
    }

    async function getDeviceUser(deviceId) {
        const { data, error } = await supabaseClient
            .from('usuarios_dispositivos')
            .select('*')
            .eq('dispositivo_id', deviceId)
            .single();

        if (error) return null;
        return data;
    }
    function getDeviceInfo() {
        const ua = navigator.userAgent;
        let brand = "Desconocido";
        let model = "Desconocido";

        if (/iPhone/.test(ua)) brand = "Apple", model = "iPhone";
        else if (/iPad/.test(ua)) brand = "Apple", model = "iPad";
        else if (/Android/.test(ua)) {
            brand = "Android";
            const match = ua.match(/Android.*; (.*) Build/);
            if (match && match[1]) model = match[1].trim();
        }

        return { brand, model };
    }

    async function registerDeviceForUser(deviceId, userId, userName) {
        const { brand, model } = getDeviceInfo();

        try {
            await supabaseClient
                .from('usuarios_dispositivos')
                .upsert({
                    usuario_id: userId,
                    usuario_nombre: userName,
                    dispositivo_id: deviceId,
                    marca: brand,
                    modelo: model,
                    ultimo_acceso: new Date().toISOString()
                }, { onConflict: ['dispositivo_id'] });
        } catch (err) {
            console.error('Error registrando dispositivo:', err);
        }
    }


       async function loginUser(userId, userName) {
           const overlay = document.getElementById('authOverlay');
           const authName = document.getElementById('authUserName');
           const deviceId = getDeviceId(); // ID único del dispositivo
           const registeredUser = await getDeviceUser(deviceId);

           // Si el dispositivo ya está registrado por otro usuario
           if (registeredUser && registeredUser.usuario_id !== userId) {
               showErrorToast(`${registeredUser.usuario_nombre}, tú no eres ${userName}`);
               return;
           }

           // Mostrar overlay con mensaje de bienvenida antes de Face ID
           authName.textContent = `Hola, ${userName}. Autentícate con Face ID`;
           overlay.classList.add('active');
           await new Promise(r => setTimeout(r, 1200));

           // Si el navegador no soporta WebAuthn
           if (!window.PublicKeyCredential) {
               // Aquí podrías decidir si registrar el dispositivo directamente
               completeLogin(userId, userName);
               return;
           }

           try {
               const storedCredential = await getUserCredential(userId);

               let credential;

               if (storedCredential) {
                   // Face ID existente
                   const challenge = new Uint8Array(32);
                   window.crypto.getRandomValues(challenge);

                   await navigator.credentials.get({
                       publicKey: {
                           challenge,
                           allowCredentials: [{
                               id: Uint8Array.from(atob(storedCredential.credential_id), c => c.charCodeAt(0)),
                               type: "public-key"
                           }],
                           userVerification: "required",
                           timeout: 60000
                       }
                   });

               } else {
                   // Crear nueva credencial si no hay existente
                   const challenge = new Uint8Array(32);
                   window.crypto.getRandomValues(challenge);

                   credential = await navigator.credentials.create({
                       publicKey: {
                           challenge,
                           rp: { name: "Pacha Sunset" },
                           user: {
                               id: new TextEncoder().encode(userId.toString()),
                               name: userName,
                               displayName: userName
                           },
                           pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                           authenticatorSelection: {
                               authenticatorAttachment: "platform",
                               userVerification: "required"
                           },
                           timeout: 60000,
                           attestation: "direct"
                       }
                   });

                   await supabaseClient.from('credenciales_biometricas').insert({
                       usuario_id: userId,
                       credential_id: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
                       public_key: JSON.stringify(credential.response)
                   });
               }

               // ✅ Solo ahora, después de que la biometría pasa:
               await registerDeviceForUser(deviceId, userId, userName);

               // Login completo
               completeLogin(userId, userName);

           } catch (err) {
               console.error('Error biométrico:', err);
               overlay.classList.remove('active'); // Oculta overlay
               showErrorToast(`Verificación biométrica fallida o cancelada`);
           }
       }


    function completeLogin(userId, userName) {
        const overlay = document.getElementById('authOverlay');
        overlay.classList.remove('active');
        currentUser = { id: userId, nombre: userName };
        document.getElementById('currentUserName').textContent = `Hola, ${userName}`;
        loadProducts();
        showProductsView();
    }

    function showProductsView() {
        document.getElementById('usersView').classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            document.getElementById('usersView').classList.add('view-hidden');
            document.getElementById('productsView').classList.remove('view-hidden');
            showProductsContent();
        }, 300);
    }

    function showUsersView() {
        document.getElementById('productsView').classList.add('view-hidden');
        document.getElementById('usersView').classList.remove('view-hidden');
        setTimeout(() => {
            document.getElementById('usersView').classList.remove('opacity-0', 'scale-95');
            selectedItems.clear();
            updateCart();
        }, 50);
    }

    function showProductsContent() {
        document.getElementById('productsContent').classList.remove('view-hidden');
        document.getElementById('historyContent').classList.add('view-hidden');
        document.getElementById('tabProducts').className = "px-5 py-2.5 brand-gradient rounded-full text-xs font-bold whitespace-nowrap shadow-lg shadow-indigo-500/20";
        document.getElementById('tabHistory').className = "px-5 py-2.5 glass rounded-full text-xs text-gray-300 font-semibold whitespace-nowrap";
        updateCart();
    }
    async function loadUserReservations() {
        document.getElementById('productsContent').classList.add('view-hidden');
        document.getElementById('historyContent').classList.remove('view-hidden');
        document.getElementById('tabHistory').className = "px-5 py-2.5 brand-gradient rounded-full text-xs font-bold whitespace-nowrap shadow-lg shadow-indigo-500/20";
        document.getElementById('tabProducts').className = "px-5 py-2.5 glass rounded-full text-xs text-gray-300 font-semibold whitespace-nowrap";
        document.getElementById('cartBar').classList.remove('active');

        const historyEl = document.getElementById('historyContent');
        historyEl.innerHTML = '<p class="text-center text-gray-500 text-sm py-10">Buscando tus reservas...</p>';

        try {
            let query = supabaseClient.from('reservas').select('*').order('fecha', { ascending: false });

            if (currentUser.nombre !== 'Angie') {
                query = query.eq('usuario_nombre', currentUser.nombre);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data.length === 0) {
                historyEl.innerHTML = '<div class="text-center py-20"><div class="text-4xl mb-4">🥂</div><p class="text-gray-400">Aún no tienes reservas registradas.</p></div>';
                return;
            }

            historyEl.innerHTML = data.map((res, index) => {
                // Numeración independiente por usuario
                const userReservationNumber = index + 1;

                const date = new Date(res.fecha);
                const boliviaDate = date.toLocaleString('es-BO', { 
                    timeZone: 'America/La_Paz',
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });

                const productsList = res.productos.map(p => `
                    <div class="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
                        <span class="text-xs text-gray-300">${p.nombre}</span>
                        <span class="text-[10px] text-gray-500 font-bold">$${p.precio}</span>
                    </div>
                `).join('');

                return `
                    <div class="glass p-5 rounded-3xl space-y-3 border-white/10">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="text-[10px] text-indigo-400 uppercase font-black tracking-widest">Reserva #${userReservationNumber}</p>
                                <p class="text-[9px] text-gray-500 font-bold mt-1">SOCIO: ${res.usuario_nombre}</p>
                                <p class="text-xs text-gray-400 font-medium">${boliviaDate}</p>
                                <p class="text-[9px] text-gray-500 font-bold mt-1">MESERO: ${res.mesero || 'No asignado'}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-[9px] text-gray-500 uppercase font-bold">Total</p>
                                <p class="text-sm font-bold text-white">$${res.total}</p>
                            </div>
                        </div>
                        <div class="bg-black/20 p-3 rounded-2xl">
                            ${productsList}
                        </div>
                    </div>
                `;
            }).join('');
        } catch (err) {
            console.error('History error:', err);
            historyEl.innerHTML = '<p class="text-center text-red-400 py-10">Error al cargar el historial.</p>';
        }
    }


    function renderUsers() {
        const grid = document.getElementById('usersGrid');
        grid.innerHTML = USERS.map(user => `
            <div class="user-card cursor-pointer group" onclick="loginUser(${user.id}, '${user.name}')">
                <div class="user-avatar-glow w-16 h-16 brand-gradient rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-2xl text-white">
                    ${user.initial}
                </div>
                <div class="text-center">
                    <h4 class="text-sm font-bold text-white tracking-tight">${user.name.split(' ')[0]}</h4>
                    <p class="text-[9px] text-gray-500 uppercase font-black tracking-tighter mt-1">Acceso VIP</p>
                </div>
            </div>
        `).join('');
    }
    function renderProducts(products = allProducts) {
        const grid = document.getElementById('productGrid');

        if (!products || products.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center text-gray-400 py-16">
                    <div class="text-3xl mb-3">🍸</div>
                    <p class="text-sm">No se encontraron productos</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = products.map(p => `
            <div id="product-${p.id}"
                onclick="toggleProduct(${p.id})"
                class="product-card-pro bg-zinc-900 ${selectedItems.has(p.id) ? 'selected' : ''}">

                <div class="selection-indicator">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="white" stroke-width="4">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                </div>

                <img src="${p.imagen}" alt="${p.nombre}" loading="lazy">

                <div class="absolute bottom-4 left-4 right-4 z-10">
                    <h3 class="text-xs font-bold truncate text-white uppercase tracking-wider">
                        ${p.nombre}
                    </h3>
                </div>
            </div>
        `).join('');
    }
    function filterProducts() {
        const input = document.getElementById('productSearch');
        if (!input) return;

        const query = input.value.toLowerCase().trim();

        if (query === '') {
            renderProducts(allProducts);
            document.body.classList.remove('searching');
            return;
        }

        const filteredProducts = allProducts.filter(p =>
            p.nombre.toLowerCase().includes(query)
        );

        renderProducts(filteredProducts);
    }


        function handleSearchFocus() {
            document.body.classList.add('searching');
        }


        function handleSearchBlur() {
            const input = document.getElementById('productSearch');
            if (input && input.value.trim() === '') {
                document.body.classList.remove('searching');
            }
        }


    function renderWaiters() {
        const grid = document.getElementById('waiterGrid');
        grid.innerHTML = WAITERS.map(w => `
            <div class="waiter-card ${selectedWaiter?.id === w.id ? 'selected' : ''}" onclick="selectWaiter(${w.id})">
                <div class="waiter-avatar">${w.initial}</div>
                <div class="flex-1">
                    <p class="text-sm font-bold text-white">${w.name}</p>
                    <p class="text-[10px] text-gray-400 uppercase tracking-tighter">Disponible para atender</p>
                </div>
                ${selectedWaiter?.id === w.id ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>' : ''}
            </div>
        `).join('');
    }

   
    function toggleProduct(id) {
        const card = document.getElementById(`product-${id}`);
        if (selectedItems.has(id)) {
            selectedItems.delete(id);
            card.classList.remove('selected');
        } else {
            selectedItems.add(id);
            card.classList.add('selected');
        }
        updateCart();
        if (window.navigator.vibrate) window.navigator.vibrate(10);
    }

    function updateCart() {
        if (document.getElementById('productsContent').classList.contains('view-hidden')) return;
        const bar = document.getElementById('cartBar');
        const summaryEl = document.getElementById('cartSummary');
        if (selectedItems.size > 0) {
            bar.classList.add('active');
            const names = Array.from(selectedItems).map(id => allProducts.find(p => p.id === id)?.nombre).filter(n => n);
            summaryEl.textContent = names.join(', ');
        } else {
            bar.classList.remove('active');
        }
    }
           function openWaiterOverlay() {
               selectedWaiter = null;
               selectedBar = null; // reinicia barra
               renderWaiters();
               renderBars();

               // 👇 MOSTRAR input solo para Angie y Tere
               const notaContainer = document.getElementById('pedidoNotaContainer');
               if (currentUser.nombre === 'Angie' || currentUser.nombre === 'Tere') {
                   notaContainer.classList.remove('hidden');

                   // 👇 ocultar input siempre al inicio
                   document.getElementById('notaInputBox').classList.add('hidden');
               } else {
                   notaContainer.classList.add('hidden');
               }

               document.getElementById('finalConfirmBtn').disabled = true;
               document.getElementById('waiterOverlay').classList.add('active');
           }
    function closeWaiterOverlay() {
        document.getElementById('waiterOverlay').classList.remove('active');
    }

    async function confirmOrderWithWaiter() {
        if (!selectedWaiter || !selectedBar) {
            showErrorToast("Selecciona mesero y barra");
            return;
        }
        const btn = document.getElementById('finalConfirmBtn');
        btn.innerHTML = `<svg class="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
        btn.disabled = true;
        // 👇 obtener nombre para el pedido opcional (solo Angie y Tere)
        let pedidoNombre = currentUser.nombre; // por defecto
        const notaInput = document.getElementById('pedidoNota');
        if ((currentUser.nombre === 'Angie' || currentUser.nombre === 'Tere') && notaInput.value.trim() !== '') {
            pedidoNombre = notaInput.value.trim();
        }
        // Preparar productos seleccionados
        const productsToOrder = Array.from(selectedItems).map(id => {
            const p = allProducts.find(prod => prod.id === id);
            return { id: p.id, nombre: p.nombre, precio: p.precio };
        });

        const total = productsToOrder.reduce((sum, p) => sum + parseFloat(p.precio), 0);

        const now = new Date();
        const boliviaTimeStr = now.toLocaleString('en-US', { timeZone: 'America/La_Paz' });
        const boliviaTime = new Date(boliviaTimeStr);
        const timeFormatted = boliviaTime.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });

        try {
            // Guardar reserva en Supabase
            const { error } = await supabaseClient
                .from('reservas')
                .insert([{ 
                    usuario_id: currentUser.id, 
                    usuario_nombre: pedidoNombre,
                    productos: productsToOrder,
                    total: total,
                    fecha: boliviaTime.toISOString(),
                    mesero: selectedWaiter.name
                }]);

            if (error) throw error;

            // Preparar mensaje para Telegram
            const telegramMessage = `✨ *PACHA SUNSET - NUEVO PEDIDO* ✨

    👤 *SOCIO:* ${pedidoNombre}
    🕺 *MESERO:* ${selectedWaiter.name}
    🕒 *HORA:* ${timeFormatted}

   📦 *PRODUCTOS:*
   ${productsToOrder.map(p => `- ${p.nombre}`).join('\n')}

   🍹 *BARRA:* ${selectedBar.name}

    💰 *TOTAL:* $${total}

    🚀 _Preparar pedido de inmediato._`;

            // Función para enviar mensaje a Telegram
            async function sendToTelegram(text) {
                const TELEGRAM_BOT_TOKEN = '8555944975:AAGXfmtq378bG_ZFenNqgT2uakl0xIRnT2I';
                const TELEGRAM_CHAT_ID = '-1003742170439';
                const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
                try {
                    await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: TELEGRAM_CHAT_ID,
                            text: text,
                            parse_mode: 'Markdown'
                        })
                    });
                } catch (err) {
                    console.error('Telegram error:', err);
                }
            }

            closeWaiterOverlay();
            showSuccess();

            // Enviar mensaje a Telegram
            sendToTelegram(telegramMessage);

            // Limpiar selección
            selectedItems.clear();
            updateCart();
            renderProducts();
            // Limpiar campo de nota después de confirmar pedido
            const notaInput = document.getElementById('pedidoNota');
            if (notaInput) notaInput.value = '';
        } catch (err) {
            console.error('Supabase error:', err);
            alert("Error al guardar la reserva.");
        } finally {
            btn.innerHTML = "Confirmar";
            btn.disabled = false;
        }
    }


    function showSuccess() {
        const toast = document.getElementById('successToast');
        toast.classList.add('active');
        if (window.navigator.vibrate) window.navigator.vibrate([10, 30, 10]);
        setTimeout(() => {
            toast.classList.remove('active');
            loadUserReservations();
        }, 3000);
    }

    renderUsers();
