// static/cart.js

(function() {
    let cart = JSON.parse(localStorage.getItem('witsecShoppingCart')) || [];

    function saveCart() {
        localStorage.setItem('witsecShoppingCart', JSON.stringify(cart));
    }

    window.addToCart = function(product) {
        // Validate product data
        if (!product.id || !product.name || !product.price) {
            console.error('Invalid product data:', product);
            return;
        }

        const quantity = Math.max(1, parseInt(product.quantity) || 1);
        const existingProductIndex = cart.findIndex(item => item.id === product.id);

        if (existingProductIndex > -1) {
            cart[existingProductIndex].quantity += quantity;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                quantity: quantity
            });
        }
        saveCart();
        updateCartDisplay();
        console.log('Cart updated:', cart);
    };

    window.getCart = function() {
        return cart;
    };

    window.updateCartDisplay = function() {
        console.log('updateCartDisplay called, cart items:', cart.length);
        const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
        const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

        console.log('Cart count:', cartCount, 'Cart total:', cartTotal);

        // Update cart count display elements
        console.log('Updating cart display elements with count:', cartCount);

        // Update cart count elements
        const cartCountElements = document.querySelectorAll('#cart-item-count, #witsec-cart-count');
        cartCountElements.forEach(el => {
            if (el) el.innerText = cartCount;
        });

        // Update cart total elements
        const cartTotalElements = document.querySelectorAll('#cart-total, #witsec-cart-total');
        cartTotalElements.forEach(el => {
            if (el) el.innerText = cartTotal.toFixed(2);
        });
    };

    window.clearCart = function() {
        cart = [];
        saveCart();
        updateCartDisplay();
    };

    window.getOrderHistory = function() {
        return JSON.parse(localStorage.getItem('witsecOrderHistory') || '[]');
    };

    window.addToOrderHistory = function(orderDetails) {
        var orderHistory = window.getOrderHistory();
        var newOrder = {
            id: 'order_' + Date.now(),
            date: new Date().toISOString(),
            items: [...cart],
            total: cart.reduce((total, item) => total + (item.price * item.quantity), 0),
            customerInfo: orderDetails.customerInfo,
            paymentDetails: orderDetails.paymentDetails
        };

        orderHistory.unshift(newOrder); // Add to beginning of array
        localStorage.setItem('witsecOrderHistory', JSON.stringify(orderHistory));
        console.log('Order added to history:', newOrder);
    };



    // --- Checkout Page Functions ---
    function renderCheckoutPage() {
        console.log('renderCheckoutPage called');
        const cartSummaryElement = document.getElementById('cart-summary');
        const cartTotalElement = document.getElementById('cart-total');
        const paypalButtonContainer = document.getElementById('paypal-button-container');
        const checkoutForm = document.getElementById('checkout-form');

        console.log('Checkout elements found:', {
            cartSummary: !!cartSummaryElement,
            cartTotal: !!cartTotalElement,
            paypalContainer: !!paypalButtonContainer,
            checkoutForm: !!checkoutForm
        });

        if (!cartSummaryElement || !cartTotalElement || !paypalButtonContainer || !checkoutForm) {
            console.log('Missing required checkout elements');
            return; // Not on the checkout page
        }

        cartSummaryElement.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartSummaryElement.innerHTML = '<p>Your cart is empty.</p>';
            cartTotalElement.innerText = '$0.00';
            return;
        }

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
            itemDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                    <div>
                        <strong>${item.name}</strong><br>
                        <small>$${item.price.toFixed(2)} x ${item.quantity}</small>
                    </div>
                    <div style="font-weight: bold;">$${itemTotal.toFixed(2)}</div>
                </div>
            `;
            cartSummaryElement.appendChild(itemDiv);
        });

        cartTotalElement.innerText = `$${total.toFixed(2)}`;

        // Load and render PayPal buttons with block parameters
        loadPayPalSDK(total.toFixed(2));
    }

    function loadPayPalSDK(totalAmount) {
        const checkoutBlock = document.querySelector('.checkout-block');
        if (!checkoutBlock) {
            console.error('Checkout block not found');
            return;
        }

        // Get PayPal settings from the block data attributes
        const paypalClientId = checkoutBlock.getAttribute('data-paypal-client-id') || 'YOUR_PAYPAL_CLIENT_ID';
        const currency = checkoutBlock.getAttribute('data-currency') || 'USD';
        const paypalSandbox = checkoutBlock.getAttribute('data-paypal-sandbox') === 'true';

        console.log('PayPal Configuration:', {
            clientId: paypalClientId,
            currency: currency,
            sandbox: paypalSandbox,
            totalAmount: totalAmount
        });

        if (paypalClientId === 'YOUR_PAYPAL_CLIENT_ID') {
            console.warn('PayPal Client ID is not set. Please configure it in the Checkout Block settings.');
            document.getElementById('paypal-button-container').innerHTML = '<div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">⚠️ PayPal Client ID not configured. Please set up your PayPal Client ID in the block parameters.</div>';
            return;
        }

        // Clear existing PayPal buttons
        const container = document.getElementById('paypal-button-container');
        if (container) {
            container.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="spinner-border text-primary" role="status"><span class="sr-only">Loading PayPal...</span></div><p>Loading PayPal...</p></div>';
        }

        // Load PayPal SDK
        const scriptId = 'paypal-sdk';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=${currency}${paypalSandbox ? '&intent=capture&auto-capture=true' : ''}`;
            script.async = true;

            script.onload = () => {
                renderPayPalButton(totalAmount, currency);
            };

            script.onerror = () => {
                if (container) {
                    container.innerHTML = '<div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">❌ Failed to load PayPal. Please check your internet connection and try again.</div>';
                }
            };

            document.head.appendChild(script);
        } else {
            // SDK already loaded, just render the button
            renderPayPalButton(totalAmount, currency);
        }
    }

    function renderPayPalButton(amount, currency) {
        const container = document.getElementById('paypal-button-container');
        if (!container || typeof paypal === 'undefined') {
            console.error('PayPal container not found or PayPal SDK not loaded');
            return;
        }

        // Clear the container
        container.innerHTML = '';

        try {
            paypal.Buttons({
                style: {
                    layout: 'vertical',
                    color: 'blue',
                    shape: 'rect',
                    label: 'paypal',
                    height: 40
                },
                createOrder: function(data, actions) {
                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                value: amount,
                                currency_code: currency
                            },
                            description: 'Purchase from Shopping Cart'
                        }]
                    });
                },
                onApprove: function(data, actions) {
                    return actions.order.capture().then(function(details) {
                        console.log('Payment completed:', details);
                        alert('✅ Payment completed successfully by ' + details.payer.name.given_name + '!');

                        // Collect customer information
                        const customerInfo = {
                            name: document.getElementById('name')?.value || '',
                            email: document.getElementById('email')?.value || '',
                            phone: document.getElementById('phone')?.value || '',
                            company: document.getElementById('company')?.value || '',
                            address: document.getElementById('address')?.value || '',
                            city: document.getElementById('city')?.value || '',
                            zip: document.getElementById('zip')?.value || '',
                            shippingAddress: document.getElementById('shipping-address')?.value || '',
                            orderNotes: document.getElementById('order-notes')?.value || '',
                            coupon: document.getElementById('coupon')?.value || '',
                            newsletter: document.getElementById('newsletter')?.checked || false,
                            giftMessage: document.getElementById('gift-message')?.value || '',
                            termsAccepted: document.getElementById('terms')?.checked || false
                        };

                        sendOrderDetails(details, customerInfo);
                        window.clearCart();

                        // Optional: redirect to success page
                        const successUrl = document.querySelector('.checkout-block')?.getAttribute('data-success-url');
                        if (successUrl) {
                            window.location.href = successUrl;
                        }
                    });
                },
                onError: function(err) {
                    console.error('PayPal Error:', err);
                    alert('❌ Payment failed. Please try again or contact support.');
                    container.innerHTML = '<div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">❌ Payment failed. Please try again.</div>';
                },
                onCancel: function(data) {
                    console.log('Payment cancelled:', data);
                    const cancelUrl = document.querySelector('.checkout-block')?.getAttribute('data-cancel-url');
                    if (cancelUrl) {
                        window.location.href = cancelUrl;
                    }
                }
            }).render('#paypal-button-container');
        } catch (error) {
            console.error('Error rendering PayPal button:', error);
            container.innerHTML = '<div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">❌ Error loading payment button. Please refresh the page.</div>';
        }
    }

    function sendOrderDetails(paypalDetails, customerInfo) {
        const checkoutBlock = document.querySelector('.checkout-block');
        const orderEmail = checkoutBlock?.getAttribute('data-order-email') || 'your_email@example.com';

        console.log('--- Order Details ---');
        console.log('Customer Info:', customerInfo);
        console.log('Cart Items:', cart);
        console.log('PayPal Transaction Details:', paypalDetails);
        console.log(`Order email should be sent to: ${orderEmail}`);
        console.warn('NOTE: Sending email requires a server-side solution or a third-party service (e.g., Formspree, EmailJS). This is a client-side placeholder.');

        // Here you would typically send this data to your server or a third-party email service.
        // Example with fetch (requires server-side endpoint):
        /*
        fetch('/send-order-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customerInfo,
                cart,
                paypalDetails,
                orderEmail
            })
        });
        */
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Initialize cart display on load
        updateCartDisplay();

        // Render checkout page if on a page with the checkout form
        if (document.getElementById('checkout-form')) {
            renderCheckoutPage();

            // Add event listener for "Proceed to Payment" button
            const proceedButton = document.getElementById('proceed-to-payment');
            if (proceedButton) {
                proceedButton.addEventListener('click', function() {
                    const form = document.getElementById('checkout-form');
                    const requiredFields = form.querySelectorAll('[required]');
                    let isValid = true;

                    // Validate required fields
                    requiredFields.forEach(field => {
                        if (!field.value.trim()) {
                            field.style.borderColor = '#dc3545';
                            isValid = false;
                        } else {
                            field.style.borderColor = '';
                        }
                    });

                    // Check terms acceptance if required
                    const termsCheckbox = document.getElementById('terms');
                    if (termsCheckbox && !termsCheckbox.checked) {
                        alert('Please accept the terms and conditions.');
                        isValid = false;
                    }

                    if (isValid) {
                        // Show PayPal button container
                        const paypalContainer = document.getElementById('paypal-button-container');
                        if (paypalContainer) {
                            paypalContainer.style.display = 'block';
                            paypalContainer.scrollIntoView({ behavior: 'smooth' });
                        }
                    } else {
                        alert('Please fill in all required fields.');
                    }
                });
            }
        }

        // Add event listener for "add to cart" buttons
        document.body.addEventListener('click', (event) => {
            const target = event.target.closest('.add-to-cart-btn');
            if (target) {
                event.preventDefault();

                const productId = target.dataset.productId;
                const productName = target.dataset.productName || 'Unknown Product';
                const productPrice = parseFloat(target.dataset.productPrice) || 0;
                const productQuantityInput = target.closest('.product-item')?.querySelector('.product-quantity');
                const productQuantity = productQuantityInput ? parseInt(productQuantityInput.value) : 1;

                if (productId && productName && productPrice > 0) {
                    window.addToCart({
                        id: productId,
                        name: productName,
                        price: productPrice,
                        quantity: productQuantity
                    });
                } else {
                    console.error('Invalid product data for add to cart');
                }
            }
        });
    });
})();
