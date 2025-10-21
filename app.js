defineM("witsec-shopping-cart", function(jQuery, mbrApp, tr) {

    mbrApp.regExtension({
        name: "witsec-shopping-cart",
        events: {
            load: function() {
                console.log("witsec Shopping Cart extension loaded.");

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
                const existingItem = window.witsecCart.items.find(item => item.id === product.id);

                if (existingItem) {
                    existingItem.quantity += product.quantity || 1;
                } else {
                    window.witsecCart.items.push({
                        id: product.id,
                        name: product.name,
                        price: parseFloat(product.price),
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
                    return total + (item.price * item.quantity);
                }, 0);
            },

            updateCartDisplay: function() {
                const count = window.witsecCart.items.reduce((total, item) => total + item.quantity, 0);
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
                        const itemDiv = document.createElement('div');
                        itemDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 8px; background: #1a1a2e; border-radius: 4px;';
                        itemDiv.innerHTML = `
                            <div style="flex: 1;">
                                <div style="font-weight: bold; color: white;">${item.name}</div>
                                <div style="color: #ccc; font-size: 12px;">$${item.price.toFixed(2)} × ${item.quantity}</div>
                            </div>
                            <div style="color: white; font-weight: bold;">$${(item.price * item.quantity).toFixed(2)}</div>
                            <button onclick="witsecCart.removeItem('${item.id}')" style="background: #dc3545; color: white; border: none; border-radius: 4px; padding: 4px 8px; margin-left: 8px; cursor: pointer;">×</button>
                        `;
                        cartItems.appendChild(itemDiv);
                    });

                    document.getElementById('witsec-cart-total').innerHTML = `<div style="color: #fedb01; font-size: 18px;">Total: $${total.toFixed(2)}</div>`;
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
                    cartUrl += `&item_number_${index + 1}=${item.id}`;
                    cartUrl += `&item_name_${index + 1}=${encodeURIComponent(item.name)}`;
                    cartUrl += `&amount_${index + 1}=${item.price}`;
                    cartUrl += `&quantity_${index + 1}=${item.quantity}`;
                });

                window.open(cartUrl, '_blank');
            },

            saveCart: function() {
                localStorage.setItem('witsecCart', JSON.stringify(window.witsecCart));
            },

            loadCart: function() {
                const saved = localStorage.getItem('witsecCart');
                if (saved) {
                    window.witsecCart = { ...window.witsecCart, ...JSON.parse(saved) };
                }
            }
        }
    });

}, ["jQuery", "mbrApp", "TR()"]);
