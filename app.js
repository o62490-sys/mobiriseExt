defineM("witsec-shopping-cart", function(jQuery, mbrApp, tr) {

    mbrApp.regExtension({
        name: "witsec-shopping-cart",
        events: {
            load: function() {
                console.log("witsec Shopping Cart extension loaded.");

                // Add a filter to replace placeholders
                mbrApp.Core.addFilter("getResultHTMLcomponent", function(html, block) {
                    if (block._name === "product-block" && block._mbrParams) {
                        const params = block._mbrParams;
                        if (params.prod1Id) html = html.replace(/{prod1Id}/g, params.prod1Id);
                        if (params.prod1Name) html = html.replace(/{prod1Name}/g, params.prod1Name);
                        if (params.prod1Price) html = html.replace(/{prod1Price}/g, params.prod1Price);
                        if (params.prod2Id) html = html.replace(/{prod2Id}/g, params.prod2Id);
                        if (params.prod2Name) html = html.replace(/{prod2Name}/g, params.prod2Name);
                        if (params.prod2Price) html = html.replace(/{prod2Price}/g, params.prod2Price);
                        if (params.prod3Id) html = html.replace(/{prod3Id}/g, params.prod3Id);
                        if (params.prod3Name) html = html.replace(/{prod3Name}/g, params.prod3Name);
                        if (params.prod3Price) html = html.replace(/{prod3Price}/g, params.prod3Price);
                        if (params.prod4Id) html = html.replace(/{prod4Id}/g, params.prod4Id);
                        if (params.prod4Name) html = html.replace(/{prod4Name}/g, params.prod4Name);
                        if (params.prod4Price) html = html.replace(/{prod4Price}/g, params.prod4Price);
                        if (params.prod5Id) html = html.replace(/{prod5Id}/g, params.prod5Id);
                        if (params.prod5Name) html = html.replace(/{prod5Name}/g, params.prod5Name);
                        if (params.prod5Price) html = html.replace(/{prod5Price}/g, params.prod5Price);
                        if (params.prod6Id) html = html.replace(/{prod6Id}/g, params.prod6Id);
                        if (params.prod6Name) html = html.replace(/{prod6Name}/g, params.prod6Name);
                        if (params.prod6Price) html = html.replace(/{prod6Price}/g, params.prod6Price);
                    }
                    return html;
                });

                // Load PayPal SDK globally like Smart Cart does
                this.loadPayPalSDK();

                // Initialize cart functionality
                this.initCart();
            }
        },
        methods: {
            loadPayPalSDK: function() {
                // Check if PayPal SDK is already loaded
                if (document.getElementById('witsec-paypal-sdk')) {
                    return;
                }

                // Get PayPal Client ID from app settings or use default
                const clientId = mbrApp.appSettings['witsec-cart-paypal-client-id'] || 'YOUR_PAYPAL_CLIENT_ID';
                const currency = mbrApp.appSettings['witsec-cart-currency'] || 'USD';

                if (clientId !== 'YOUR_PAYPAL_CLIENT_ID') {
                    const script = document.createElement('script');
                    script.id = 'witsec-paypal-sdk';
                    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`;
                    script.async = true;
                    document.head.appendChild(script);
                    console.log('PayPal SDK loaded with Client ID:', clientId);
                }
            },

            initCart: function() {
                // Add floating cart display like Smart Cart
                if (!document.getElementById('witsec-cart-display')) {
                    const cartDisplay = document.createElement('div');
                    cartDisplay.id = 'witsec-cart-display';
                    cartDisplay.innerHTML = `
                        <div style="position: fixed; top: 150px; right: 20px; z-index: 1000;">
                            <div id="witsec-shopping-cart" style="background: #14142b; color: white; border-radius: 8px; padding: 15px; width: 300px; display: none;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                    <h4 style="margin: 0; color: white;">Your Cart</h4>
                                    <button id="witsec-cart-close" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">×</button>
                                </div>
                                <div id="witsec-cart-items"></div>
                                <div id="witsec-cart-total" style="border-top: 1px solid #444; padding-top: 10px; margin-top: 10px; text-align: center; font-weight: bold;"></div>
                                <div id="witsec-cart-buttons" style="margin-top: 15px;">
                                    <button id="witsec-cart-checkout" class="btn btn-primary" style="width: 100%; margin-bottom: 5px;">Checkout with PayPal</button>
                                    <button id="witsec-cart-clear" class="btn btn-secondary" style="width: 100%;">Clear Cart</button>
                                </div>
                            </div>
                            <div id="witsec-cart-toggle" style="background: #14142b; color: white; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; cursor: pointer; position: relative;">
                                <span id="witsec-cart-count">0</span>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(cartDisplay);

                    // Add event listeners
                    document.getElementById('witsec-cart-toggle').addEventListener('click', this.toggleCart.bind(this));
                    document.getElementById('witsec-cart-close').addEventListener('click', this.toggleCart.bind(this));
                    document.getElementById('witsec-cart-clear').addEventListener('click', this.clearCart.bind(this));
                    document.getElementById('witsec-cart-checkout').addEventListener('click', this.checkout.bind(this));
                }

                // Initialize cart data
                if (!window.witsecCart) {
                    window.witsecCart = {
                        items: [],
                        total: 0,
                        updateDisplay: this.updateCartDisplay.bind(this),
                        addItem: this.addItem.bind(this),
                        removeItem: this.removeItem.bind(this),
                        clear: this.clearCart.bind(this)
                    };
                }

                this.updateCartDisplay();
            },

            addItem: function(product) {
                const price = parseFloat(product.price) || 0;

                if (!product.id || !product.name || isNaN(price)) {
                    console.error('Invalid product data:', product);
                    return;
                }

                const existingItem = window.witsecCart.items.find(item => item.id === product.id);

                if (existingItem) {
                    existingItem.quantity += product.quantity || 1;
                } else {
                    window.witsecCart.items.push({
                        id: product.id,
                        name: product.name,
                        price: price,
                        quantity: product.quantity || 1
                    });
                }

                this.calculateTotal();
                this.updateCartDisplay();
                this.saveCart();
            },

            removeItem: function(productId) {
                window.witsecCart.items = window.witsecCart.items.filter(item => item.id !== productId);
                this.calculateTotal();
                this.updateCartDisplay();
                this.saveCart();
            },

            calculateTotal: function() {
                window.witsecCart.total = window.witsecCart.items.reduce((total, item) => {
                    if (!item || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
                        console.error('Invalid item in total calculation:', item);
                        return total;
                    }
                    return total + (item.price * item.quantity);
                }, 0);
            },

            updateCartDisplay: function() {
                const count = window.witsecCart.items.reduce((total, item) => {
                    if (!item || typeof item.quantity !== 'number') {
                        console.error('Invalid item in count calculation:', item);
                        return total;
                    }
                    return total + item.quantity;
                }, 0);
                const total = window.witsecCart.total;

                // Update count display
                document.getElementById('witsec-cart-count').textContent = count;

                // Update cart items
                const cartItems = document.getElementById('witsec-cart-items');
                cartItems.innerHTML = '';

                if (window.witsecCart.items.length === 0) {
                    cartItems.innerHTML = '<p style="color: #ccc; text-align: center;">Your cart is empty</p>';
                    document.getElementById('witsec-cart-total').textContent = '';
                } else {
                    window.witsecCart.items.forEach(item => {
                        // Validate item data
                        if (!item || typeof item.price !== 'number' || typeof item.quantity !== 'number' || !item.name) {
                            console.error('Invalid item in cart:', item);
                            return;
                        }

                        const price = parseFloat(item.price) || 0;
                        const quantity = parseInt(item.quantity) || 1;

                        const itemDiv = document.createElement('div');
                        itemDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 8px; background: #1a1a2e; border-radius: 4px;';
                        itemDiv.innerHTML = `
                            <div style="flex: 1;">
                                <div style="font-weight: bold; color: white;">${item.name}</div>
                                <div style="color: #ccc; font-size: 12px;">€${price.toFixed(2)} × ${quantity}</div>
                            </div>
                            <div style="color: white; font-weight: bold;">€${(price * quantity).toFixed(2)}</div>
                            <button onclick="witsecCart.removeItem('${item.id}')" style="background: #dc3545; color: white; border: none; border-radius: 4px; padding: 4px 8px; margin-left: 8px; cursor: pointer;">×</button>
                        `;
                        cartItems.appendChild(itemDiv);
                    });

                    document.getElementById('witsec-cart-total').innerHTML = `<div style="color: #fedb01; font-size: 18px;">Total: €${total.toFixed(2)}</div>`;
                }
            },

            toggleCart: function() {
                const cart = document.getElementById('witsec-shopping-cart');
                cart.style.display = cart.style.display === 'block' ? 'none' : 'block';
            },

            clearCart: function() {
                window.witsecCart.items = [];
                window.witsecCart.total = 0;
                this.updateCartDisplay();
                this.saveCart();
            },

            checkout: function() {
                if (window.witsecCart.items.length === 0) {
                    alert('Your cart is empty!');
                    return;
                }

                // Use PayPal SDK if available, otherwise fallback to direct links
                if (typeof paypal !== 'undefined') {
                    this.payPalCheckout();
                } else {
                    this.directPayPalCheckout();
                }
            },

            payPalCheckout: function() {
                const total = window.witsecCart.total;
                const currency = mbrApp.appSettings['witsec-cart-currency'] || 'USD';

                // Validate cart items before creating PayPal order
                const validItems = window.witsecCart.items.filter(item =>
                    item && typeof item.price === 'number' && typeof item.quantity === 'number' && item.name
                );

                if (validItems.length !== window.witsecCart.items.length) {
                    console.error('Some items in cart are invalid for PayPal checkout');
                    alert('Some items in your cart are invalid. Please clear your cart and try again.');
                    return;
                }

                paypal.Buttons({
                    createOrder: (data, actions) => {
                        return actions.order.create({
                            purchase_units: [{
                                amount: {
                                    value: total.toFixed(2),
                                    currency_code: currency
                                }
                            }]
                        });
                    },
                    onApprove: (data, actions) => {
                        return actions.order.capture().then(details => {
                            alert('Payment completed successfully!');
                            this.clearCart();
                            this.toggleCart();
                        });
                    }
                }).render('#witsec-cart-checkout');
            },

            directPayPalCheckout: function() {
                // Fallback to direct PayPal links like Smart Cart does
                const baseUrl = 'https://www.paypal.com/cgi-bin/webscr';
                const currency = mbrApp.appSettings['witsec-cart-currency'] || 'USD';
                let cartUrl = `${baseUrl}?cmd=_cart&business=YOUR_EMAIL@EXAMPLE.COM&currency_code=${currency}`;

                window.witsecCart.items.forEach((item, index) => {
                    // Validate item data before adding to PayPal URL
                    if (!item || typeof item.price !== 'number' || typeof item.quantity !== 'number' || !item.name) {
                        console.error('Invalid item in PayPal checkout:', item);
                        return;
                    }

                    cartUrl += `&item_number_${index + 1}=${item.id}`;
                    cartUrl += `&item_name_${index + 1}=${encodeURIComponent(item.name)}`;
                    cartUrl += `&amount_${index + 1}=${item.price}`;
                    cartUrl += `&quantity_${index + 1}=${item.quantity}`;
                });

                window.open(cartUrl, '_blank');
            },

            saveCart: function() {
                localStorage.setItem('witsecShoppingCart', JSON.stringify(window.witsecCart));
            },

            loadCart: function() {
                const saved = localStorage.getItem('witsecShoppingCart');
                if (saved) {
                    try {
                        const parsedCart = JSON.parse(saved);
                        // Validate loaded cart data
                        if (parsedCart && Array.isArray(parsedCart.items)) {
                            // Filter out invalid items
                            parsedCart.items = parsedCart.items.filter(item =>
                                item && typeof item.price === 'number' && typeof item.quantity === 'number' && item.name
                            );
                            window.witsecCart = { ...window.witsecCart, ...parsedCart };
                        }
                    } catch (error) {
                        console.error('Error loading cart from localStorage:', error);
                        // Clear corrupted cart data
                        localStorage.removeItem('witsecShoppingCart');
                    }
                }
            }
        }
    });

}, ["jQuery", "mbrApp", "TR()"]);
