$(document).ready(function () {
    document.getElementById("notificationList").innerHTML = `
    <div class="notification-item">
        <div class="notification-title">מלאי נמוך</div>
        <div class="notification-text">עכבר אלחוטי – נותרו 8 יחידות</div>
    </div>

    <div class="notification-item">
        <div class="notification-title">מוצר אזל</div>
        <div class="notification-text">כבל HDMI אזל מהמחסן</div>
    </div>
`;
    function exportToPDF() {
        // 1. זהה את האלמנט שברצונך לייצא
        const element = document.getElementById('reportContainer');

        if (!element) {
            console.error("Report container not found. Make sure the main report content is wrapped in an element with id='reportContainer'");
            alert("שגיאה: לא נמצא תוכן הדוח.");
            return;
        }

        // 2. הגדר את אפשרויות ה-PDF
        const options = {
            margin: 10,
            filename: 'דוח-מלאי-' + new Date().toLocaleDateString('he-IL') + '.pdf', // שם הקובץ
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 }, // רזולוציה גבוהה יותר
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } // גודל נייר ופרופורציות
        };

        // 3. הפעל את פונקציית הייצוא
        html2pdf().set(options).from(element).save();
    }

    function toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        sidebar.classList.toggle('mobile-show');
    }

    document.addEventListener('click', function (e) {
        const sidebar = document.querySelector('.sidebar');
        const isClickInsideSidebar = sidebar.contains(e.target);
        const isClickOnMenuButton = e.target.closest('.mobile-only');

        if (window.innerWidth <= 1024 && !isClickInsideSidebar && !isClickOnMenuButton) {
            sidebar.classList.remove('mobile-show');
        }
    });

    // Data Storage
    let warehouses = [
        { id: 1, name: 'מחסן M' },
        { id: 2, name: 'מחסן EM' },
        { id: 3, name: 'מחסן D' },
        { id: 4, name: 'מחסן EF' }
    ];

    let products = [
        { id: 1, name: 'מחשב נייד Dell', type: 'אלקטרוניקה', min: 10, qty: 5, warehouse: 'מחסן M' },
        { id: 2, name: 'כיסא משרדי', type: 'ריהוט', min: 20, qty: 45, warehouse: 'מחסן EM' },
        { id: 3, name: 'מקלדת אלחוטית', type: 'אלקטרוניקה', min: 15, qty: 8, warehouse: 'מחסן D' },
        { id: 4, name: 'מסך מחשב', type: 'אלקטרוניקה', min: 10, qty: 25, warehouse: 'מחסן EF' },
        { id: 5, name: 'שולחן כתיבה', type: 'ריהוט', min: 5, qty: 12, warehouse: 'מחסן M' },
        { id: 6, name: 'מקדחה חשמלית', type: 'כלי עבודה', min: 8, qty: 3, warehouse: 'מחסן EM' },
    ];

    let auditLog = [];
    let currentUser = {
        firstName: 'אדמין',
        lastName: 'ראשי',
        username: 'admin',
        role: 'admin',
        initials: 'AR',
        profileImage: null
    };
    let adminWelcomeShown = false;

    // Initialize
    document.addEventListener('DOMContentLoaded', function () {
        updateUserDisplay();
        updateWarehouseSelectors();
        updateDashboard();
        renderProducts();
        renderWarehouses();
        updateNotifications();
        initCharts();
        checkAdminWelcome();
        initDragAndDrop();
    });

    // Drag and Drop for Charts
    let draggedElement = null;

    function initDragAndDrop() {
        const chartCards = document.querySelectorAll('.chart-card[draggable="true"]');

        chartCards.forEach(card => {
            card.addEventListener('dragstart', handleDragStart);
            card.addEventListener('dragend', handleDragEnd);
            card.addEventListener('dragover', handleDragOver);
            card.addEventListener('drop', handleDrop);
            card.addEventListener('dragenter', handleDragEnter);
            card.addEventListener('dragleave', handleDragLeave);
        });
    }

    function handleDragStart(e) {
        draggedElement = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
    }

    function handleDragEnd(e) {
        this.classList.remove('dragging');

        document.querySelectorAll('.chart-card').forEach(card => {
            card.classList.remove('drag-over');
        });
    }

    function handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDragEnter(e) {
        if (this !== draggedElement) {
            this.classList.add('drag-over');
        }
    }

    function handleDragLeave(e) {
        this.classList.remove('drag-over');
    }

    function handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }

        if (draggedElement !== this) {
            const container = document.getElementById('chartsContainer');
            const allCards = [...container.querySelectorAll('.chart-card')];
            const draggedIndex = allCards.indexOf(draggedElement);
            const targetIndex = allCards.indexOf(this);

            if (draggedIndex < targetIndex) {
                this.parentNode.insertBefore(draggedElement, this.nextSibling);
            } else {
                this.parentNode.insertBefore(draggedElement, this);
            }

            // Save order to localStorage
            saveChartOrder();

            // Show feedback
            const notification = document.createElement('div');
            notification.style.cssText = `
                    position: fixed;
                    top: 100px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
                    color: white;
                    padding: 12px 24px;
                    border-radius: 12px;
                    box-shadow: var(--shadow-lg);
                    z-index: 10000;
                    animation: slideDown 0.3s ease;
                    font-weight: 600;
                `;
            notification.innerHTML = '<i class="fas fa-check"></i> סדר הגרפים נשמר';
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        }

        this.classList.remove('drag-over');
        return false;
    }

    function saveChartOrder() {
        const container = document.getElementById('chartsContainer');
        const order = [...container.querySelectorAll('.chart-card')].map(card =>
            card.getAttribute('data-chart-id')
        );
        localStorage.setItem('chartOrder', JSON.stringify(order));
    }

    function loadChartOrder() {
        const savedOrder = localStorage.getItem('chartOrder');
        if (!savedOrder) return;

        try {
            const order = JSON.parse(savedOrder);
            const container = document.getElementById('chartsContainer');
            const cards = {};

            container.querySelectorAll('.chart-card').forEach(card => {
                const id = card.getAttribute('data-chart-id');
                cards[id] = card;
            });

            order.forEach(id => {
                if (cards[id]) {
                    container.appendChild(cards[id]);
                }
            });
        } catch (e) {
            console.error('Error loading chart order:', e);
        }
    }

    // Load saved order on page load
    setTimeout(loadChartOrder, 100);

    // User Display
    function updateUserDisplay() {
        document.getElementById('userName').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
        document.getElementById('userRole').textContent = `@${currentUser.username}`;

        const headerAvatar = document.getElementById('headerAvatar');
        const initialsSpan = document.getElementById('userInitials');

        if (currentUser.profileImage) {
            headerAvatar.innerHTML = `<img src="${currentUser.profileImage}" alt="Profile">`;
        } else {
            headerAvatar.innerHTML = `<span id="userInitials">${currentUser.initials}</span>`;
        }

        // Update profile page preview
        const profilePreview = document.getElementById('profileImagePreview');
        const previewInitials = document.getElementById('previewInitials');

        if (currentUser.profileImage) {
            profilePreview.innerHTML = `<img src="${currentUser.profileImage}" alt="Profile">`;
            document.getElementById('removeImageBtn').style.display = 'inline-flex';
        } else {
            profilePreview.innerHTML = `<span id="previewInitials">${currentUser.initials}</span>`;
            document.getElementById('removeImageBtn').style.display = 'none';
        }
    }

    // Profile Image Upload
    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type - only PNG and JPG
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            alert('נא להעלות קובץ PNG או JPG בלבד');
            event.target.value = '';
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('גודל הקובץ חורג מ-5MB');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            currentUser.profileImage = e.target.result;
            updateUserDisplay();
            logAudit('עדכון פרופיל', 'עודכנה תמונת הפרופיל');
            alert('תמונת הפרופיל הועלתה בהצלחה!');
        };
        reader.readAsDataURL(file);
    }

    function removeProfileImage() {
        if (confirm('האם אתה בטוח שברצונך להסיר את תמונת הפרופיל?')) {
            currentUser.profileImage = null;
            updateUserDisplay();
            document.getElementById('profileImageInput').value = '';
            logAudit('עדכון פרופיל', 'הוסרה תמונת הפרופיל');
        }
    }

    // Warehouses Management
    function updateWarehouseSelectors() {
        const filterSelect = document.getElementById('filterWarehouse');
        const addSelect = document.getElementById('newProductWarehouse');

        // Update filter dropdown
        const currentFilter = filterSelect.value;
        filterSelect.innerHTML = '<option value="">כל המחסנים</option>' +
            warehouses.map(w => `<option value="${w.name}">${w.name}</option>`).join('');
        filterSelect.value = currentFilter;

        // Update add product dropdown
        addSelect.innerHTML = warehouses.map(w => `<option value="${w.name}">${w.name}</option>`).join('');
    }

    function renderWarehouses() {
        const tbody = document.getElementById('warehousesTable');

        tbody.innerHTML = warehouses.map(w => {
            const warehouseProducts = products.filter(p => p.warehouse === w.name);
            const totalQty = warehouseProducts.reduce((sum, p) => sum + p.qty, 0);
            const productCount = warehouseProducts.length;

            return `
                    <tr>
                        <td>
                            <div class="action-buttons">
                                <button class="icon-btn edit" onclick="editWarehouse(${w.id})" title="ערוך">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="icon-btn delete" onclick="deleteWarehouse(${w.id})" title="מחק">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                        <td><span class="badge badge-success">${productCount}</span></td>
                        <td><strong>${totalQty}</strong></td>
                        <td><strong>${w.name}</strong></td>
                    </tr>
                `;
        }).join('');
    }

    function showAddWarehouseModal() {
        const name = prompt('הזן שם מחסן חדש:');
        if (name && name.trim()) {
            if (warehouses.some(w => w.name === name.trim())) {
                alert('שם מחסן זה כבר קיים במערכת');
                return;
            }

            const newWarehouse = {
                id: warehouses.length > 0 ? Math.max(...warehouses.map(w => w.id)) + 1 : 1,
                name: name.trim()
            };

            warehouses.push(newWarehouse);
            logAudit('הוספה', `נוסף מחסן חדש "${name.trim()}"`);

            updateWarehouseSelectors();
            renderWarehouses();
            alert('המחסן נוסף בהצלחה!');
        }
    }

    function editWarehouse(id) {
        const warehouse = warehouses.find(w => w.id === id);
        const newName = prompt(`עדכן שם מחסן:`, warehouse.name);

        if (newName && newName.trim() && newName !== warehouse.name) {
            if (warehouses.some(w => w.name === newName.trim() && w.id !== id)) {
                alert('שם מחסן זה כבר קיים במערכת');
                return;
            }

            // Update all products with this warehouse
            products.forEach(p => {
                if (p.warehouse === warehouse.name) {
                    p.warehouse = newName.trim();
                }
            });

            logAudit('עדכון', `עודכן שם מחסן מ-"${warehouse.name}" ל-"${newName.trim()}"`);
            warehouse.name = newName.trim();

            updateWarehouseSelectors();
            renderWarehouses();
            renderProducts();
            alert('שם המחסן עודכן בהצלחה!');
        }
    }

    function deleteWarehouse(id) {
        const warehouse = warehouses.find(w => w.id === id);
        const warehouseProducts = products.filter(p => p.warehouse === warehouse.name);

        if (warehouseProducts.length > 0) {
            alert(`לא ניתן למחוק מחסן זה - קיימים ${warehouseProducts.length} מוצרים המשויכים אליו.\nנא להעביר או למחוק את המוצרים תחילה.`);
            return;
        }

        if (confirm(`האם אתה בטוח שברצונך למחוק את "${warehouse.name}"?`)) {
            warehouses = warehouses.filter(w => w.id !== id);
            logAudit('מחיקה', `נמחק מחסן "${warehouse.name}"`);

            updateWarehouseSelectors();
            renderWarehouses();
            alert('המחסן נמחק בהצלחה!');
        }
    }

    // Navigation
    function showPage(pageId) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

        document.getElementById(pageId).classList.add('active');
        document.querySelector(`[onclick="showPage('${pageId}')"]`).classList.add('active');

        if (document.getElementById('userDropdown').classList.contains('show')) {
            toggleUserDropdown();
        }
    }

    // User Dropdown
    function toggleUserDropdown() {
        document.getElementById('userDropdown').classList.toggle('show');
    }

    // Notifications
    function toggleNotifications() {
        document.getElementById('notificationPanel').classList.toggle('show');
    }

    // שימוש בדוגמה זו מחייב ש-products יהיה זמין בגלובלי או מועבר כפרמטר
    // const products = [ ... ]; 

    function updateNotifications() {
        // 1. סנן את המוצרים הרלוונטיים
        const lowStockProducts = products.filter(p => p.qty > 0 && p.qty <= p.min); // מלאי נמוך אבל לא 0
        const outOfStockProducts = products.filter(p => p.qty === 0); // אזל לחלוטין

        let htmlContent = '';

        // 2. ספירת סך ההתראות ⭐ חדש! ⭐
        const totalNotifications = lowStockProducts.length + outOfStockProducts.length;

        // 3. צור HTML עבור מוצרים במלאי נמוך
        lowStockProducts.forEach(product => {
            htmlContent += `
            <div class="notification-item">
                <div class="notification-title">מלאי נמוך</div>
                <div class="notification-text">${product.name} – נותרו ${product.qty} יחידות</div>
            </div>
        `;
        });

        // 4. צור HTML עבור מוצרים שאזלו
        outOfStockProducts.forEach(product => {
            htmlContent += `
            <div class="notification-item">
                <div class="notification-title">מוצר אזל</div>
                <div class="notification-text">${product.name} אזל מהמחסן</div>
            </div>
        `;
        });

        // 5. הכנס את התוכן לרשימת ההתראות
        const notificationListElement = document.getElementById("notificationList");
        if (notificationListElement) {
            notificationListElement.innerHTML = htmlContent;
        }

        // 6. ⭐ עדכון המונה מעל הפעמון! ⭐
        const counterElement = document.getElementById("notificationBadge");

        if (counterElement) {
            counterElement.innerHTML = totalNotifications;

            // הצגה/הסתרה (בדרך כלל אם המספר 0 מסתירים את המונה)
            if (totalNotifications > 0) {
                counterElement.style.display = 'inline-block'; // או 'block'
            } else {
                counterElement.style.display = 'none';
            }
        }

        // הפונקציה toggleNotifications נשארת כפי שהיא ומטפלת בפתיחת הפאנל.
    }

    // יש לקרוא לפונקציה הזו (updateNotifications()) לאחר טעינת הדף 
    // או בכל פעם שנתוני המלאי משתנים.

    /*
    כדי שזה יעבוד, יש לוודא:
    1. קיים מערך `products` עם אובייקטים המכילים שדות: {name: '...', qty: X, min: Y}.
    2. קיים רכיב HTML במבנה הדף עם `id="notificationList"`.
    */

    // Fullscreen
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    // Dashboard
    function updateDashboard() {
        const totalQty = products.reduce((sum, p) => sum + p.qty, 0);
        const lowStock = products.filter(p => p.qty <= p.min).length;

        const usage = {};
        products.forEach(p => {
            usage[p.name] = (usage[p.name] || 0) + (p.min - p.qty);
        });

        const mostUsed = Object.keys(usage).reduce((a, b) => usage[a] > usage[b] ? a : b, '-');

        document.getElementById('totalProducts').textContent = totalQty;
        document.getElementById('lowStockCount').textContent = lowStock;
        document.getElementById('mostUsedProduct').textContent = mostUsed.split(' ')[0];

        // Update low stock list
        updateLowStockList();
    }

    function updateLowStockList() {
        const lowStockContainer = document.getElementById('lowStockList');

        // Get all products grouped by name (across all warehouses)
        const productGroups = {};
        products.forEach(p => {
            if (!productGroups[p.name]) {
                productGroups[p.name] = {
                    name: p.name,
                    type: p.type,
                    totalQty: 0,
                    totalMin: 0,
                    warehouses: []
                };
            }
            productGroups[p.name].totalQty += p.qty;
            productGroups[p.name].totalMin += p.min;
            productGroups[p.name].warehouses.push({
                warehouse: p.warehouse,
                qty: p.qty,
                min: p.min
            });
        });

        // Filter products that need reordering
        const needsReorder = Object.values(productGroups).filter(pg => pg.totalQty <= pg.totalMin);

        if (needsReorder.length === 0) {
            lowStockContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-check-circle"></i>
                        <p>כל המוצרים במלאי תקין!</p>
                    </div>
                `;
            return;
        }

        // Sort by urgency (out of stock first, then by percentage)
        needsReorder.sort((a, b) => {
            const aPercentage = a.totalQty / a.totalMin;
            const bPercentage = b.totalQty / b.totalMin;
            return aPercentage - bPercentage;
        });

        lowStockContainer.innerHTML = needsReorder.map(pg => {
            const percentage = Math.round((pg.totalQty / pg.totalMin) * 100);
            const isCritical = pg.totalQty === 0 || percentage < 50;
            const shortage = pg.totalMin - pg.totalQty;

            return `
                    <div class="low-stock-item">
                        <div class="low-stock-info">
                            <div class="low-stock-name">
                                <i class="fas fa-${pg.totalQty === 0 ? 'ban' : 'exclamation-triangle'}" style="color: var(--danger-color);"></i>
                                ${pg.name}
                            </div>
                            <div class="low-stock-details">
                                <span class="low-stock-badge ${isCritical ? 'critical' : 'warning'}">
                                    <i class="fas fa-boxes"></i>
                                    ${pg.totalQty} יחידות זמינות
                                </span>
                                <span class="low-stock-badge">
                                    <i class="fas fa-chart-line"></i>
                                    מינימום: ${pg.totalMin}
                                </span>
                                <span class="low-stock-badge">
                                    <i class="fas fa-arrow-up"></i>
                                    נדרש להזמין: ${shortage}
                                </span>
                                ${pg.warehouses.length > 1 ? `
                                    <span class="low-stock-badge">
                                        <i class="fas fa-warehouse"></i>
                                        ${pg.warehouses.length} מחסנים
                                    </span>
                                ` : `
                                    <span class="low-stock-badge">
                                        <i class="fas fa-map-marker-alt"></i>
                                        ${pg.warehouses[0].warehouse}
                                    </span>
                                `}
                            </div>
                        </div>
                        <div class="low-stock-action">
                            <button class="icon-btn" onclick="showProductDetails('${pg.name}')" title="פרטים מלאים">
                                <i class="fas fa-info-circle"></i>
                            </button>
                        </div>
                    </div>
                `;
        }).join('');
    }

    function showProductDetails(productName) {
        const productInstances = products.filter(p => p.name === productName);

        let details = `מוצר: ${productName}\n\n`;
        details += 'פילוח לפי מחסנים:\n';
        productInstances.forEach(p => {
            details += `\n${p.warehouse}:\n`;
            details += `  - כמות זמינה: ${p.qty}\n`;
            details += `  - כמות מינימלית: ${p.min}\n`;
            details += `  - נדרש להזמין: ${Math.max(0, p.min - p.qty)}\n`;
        });

        alert(details);
    }

    // Charts
    let usageChart, warehouseChart, yearlyChart;

    function initCharts() {
        // Usage Chart
        const usageCtx = document.getElementById('usageChart').getContext('2d');
        usageChart = new Chart(usageCtx, {
            type: 'bar',
            data: {
                labels: products.slice(0, 5).map(p => p.name),
                datasets: [{
                    label: 'יציאה מהמלאי',
                    data: products.slice(0, 5).map(p => p.min - p.qty),
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        // Warehouse Chart
        const warehouseCtx = document.getElementById('warehouseChart').getContext('2d');
        const warehouseData = {};
        products.forEach(p => {
            warehouseData[p.warehouse] = (warehouseData[p.warehouse] || 0) + p.qty;
        });

        warehouseChart = new Chart(warehouseCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(warehouseData),
                datasets: [{
                    data: Object.values(warehouseData),
                    backgroundColor: [
                        'rgba(99, 102, 241, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(245, 158, 11, 0.8)'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

        // Yearly Trend Chart
        const yearlyCtx = document.getElementById('yearlyTrendChart').getContext('2d');
        const topProduct = products.length > 0 ? products[0].name : 'מוצר מוביל';

        yearlyChart = new Chart(yearlyCtx, {
            type: 'line',
            data: {
                labels: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר'],
                datasets: [{
                    label: topProduct,
                    data: [45, 52, 38, 65, 59, 80, 81, 76, 85, 90],
                    borderColor: 'rgba(99, 102, 241, 1)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                size: 14,
                                weight: 'bold'
                            },
                            color: 'rgba(99, 102, 241, 1)',
                            padding: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        callbacks: {
                            title: function (context) {
                                return context[0].label;
                            },
                            label: function (context) {
                                return `${topProduct}: ${context.parsed.y} יחידות`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'יחידות שיצאו מהמלאי',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'חודשים',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    }
                }
            }
        });
    }

    // Products
    let editingProductId = null;

    function renderProducts() {
        const tbody = document.getElementById('productsTable');
        const searchTerm = document.getElementById('searchProduct').value.toLowerCase();
        const warehouseFilter = document.getElementById('filterWarehouse').value;

        const filtered = products.filter(p => {
            const matchSearch = p.name.toLowerCase().includes(searchTerm) || p.type.toLowerCase().includes(searchTerm);
            const matchWarehouse = !warehouseFilter || p.warehouse === warehouseFilter;
            return matchSearch && matchWarehouse;
        });

        tbody.innerHTML = filtered.map(p => `
                <tr class="${p.qty <= p.min ? 'low-stock' : ''}">
                    <td><strong>${p.name}</strong></td>
                    <td>${p.type}</td>
                    <td>${p.min}</td>
                    <td><strong>${p.qty}</strong></td>
                    <td><span class="badge badge-success">${p.warehouse}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="icon-btn edit" onclick="openEditModal(${p.id})" title="ערוך">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="icon-btn delete" onclick="deleteProduct(${p.id})" title="מחק">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');

        updateDashboard();
        updateNotifications();
    }

    function filterProducts() {
        renderProducts();
    }

    function toggleAddForm() {
        const form = document.getElementById('addProductForm');
        form.classList.toggle('show');
    }

    function addProduct() {
        const name = document.getElementById('newProductName').value;
        const type = document.getElementById('newProductType').value;
        const min = parseInt(document.getElementById('newProductMin').value);
        const qty = parseInt(document.getElementById('newProductQty').value);
        const warehouse = document.getElementById('newProductWarehouse').value;

        if (!name || isNaN(min) || isNaN(qty)) {
            alert('אנא מלא את כל השדות');
            return;
        }

        const newProduct = {
            id: products.length + 1,
            name, type, min, qty, warehouse
        };

        products.push(newProduct);
        logAudit('הוספה', `נוסף מוצר "${name}" ב${warehouse}`);

        document.getElementById('newProductName').value = '';
        document.getElementById('newProductMin').value = '';
        document.getElementById('newProductQty').value = '';

        toggleAddForm();
        renderProducts();
        alert('המוצר נוסף בהצלחה!');
    }

    function openEditModal(id) {
        editingProductId = id;
        const product = products.find(p => p.id === id);

        if (!product) return;

        // Fill the form
        document.getElementById('editProductName').value = product.name;
        document.getElementById('editProductType').value = product.type;
        document.getElementById('editProductMin').value = product.min;
        document.getElementById('editProductQty').value = product.qty;

        // Update warehouse dropdown
        const warehouseSelect = document.getElementById('editProductWarehouse');
        warehouseSelect.innerHTML = warehouses.map(w => `<option value="${w.name}">${w.name}</option>`).join('');
        warehouseSelect.value = product.warehouse;

        // Show modal
        document.getElementById('editProductModal').classList.add('show');
    }

    function closeEditModal() {
        document.getElementById('editProductModal').classList.remove('show');
        editingProductId = null;
    }

    function saveProductEdit() {
        if (!editingProductId) return;

        const product = products.find(p => p.id === editingProductId);
        if (!product) return;

        const newName = document.getElementById('editProductName').value;
        const newType = document.getElementById('editProductType').value;
        const newMin = parseInt(document.getElementById('editProductMin').value);
        const newQty = parseInt(document.getElementById('editProductQty').value);
        const newWarehouse = document.getElementById('editProductWarehouse').value;

        if (!newName || isNaN(newMin) || isNaN(newQty)) {
            alert('אנא מלא את כל השדות');
            return;
        }

        // Log changes
        let changes = [];
        if (product.name !== newName) changes.push(`שם: "${product.name}" → "${newName}"`);
        if (product.type !== newType) changes.push(`סוג: "${product.type}" → "${newType}"`);
        if (product.min !== newMin) changes.push(`מינימום: ${product.min} → ${newMin}`);
        if (product.qty !== newQty) changes.push(`כמות: ${product.qty} → ${newQty}`);
        if (product.warehouse !== newWarehouse) changes.push(`מחסן: "${product.warehouse}" → "${newWarehouse}"`);

        // Update product
        product.name = newName;
        product.type = newType;
        product.min = newMin;
        product.qty = newQty;
        product.warehouse = newWarehouse;

        if (changes.length > 0) {
            logAudit('עדכון', `עודכן מוצר "${newName}": ${changes.join(', ')}`);
        }

        closeEditModal();
        renderProducts();
        alert('המוצר עודכן בהצלחה!');
    }

    function deleteProduct(id) {
        if (confirm('האם אתה בטוח שברצונך למחוק מוצר זה?')) {
            const product = products.find(p => p.id === id);
            logAudit('מחיקה', `נמחק מוצר "${product.name}"`);
            products = products.filter(p => p.id !== id);
            renderProducts();
            alert('המוצר נמחק בהצלחה!');
        }
    }

    // Audit Log
    function logAudit(action, details) {
        auditLog.unshift({
            user: currentUser.username,
            fullName: `${currentUser.firstName} ${currentUser.lastName}`,
            action: action,
            details: details,
            timestamp: new Date().toLocaleString('he-IL')
        });
    }

    // Profile Management
    function updateProfile() {
        const firstName = document.getElementById('profileFirstName').value;
        const lastName = document.getElementById('profileLastName').value;

        if (!firstName || !lastName) {
            alert('אנא מלא את כל השדות');
            return;
        }

        currentUser.firstName = firstName;
        currentUser.lastName = lastName;
        currentUser.initials = firstName.charAt(0) + lastName.charAt(0);

        updateUserDisplay();
        logAudit('עדכון פרופיל', 'עודכנו פרטי המשתמש');
        alert('הפרופיל עודכן בהצלחה!');
    }

    function changePassword() {
        const currentPass = document.getElementById('currentPassword').value;
        const newPass = document.getElementById('newPassword').value;
        const confirmPass = document.getElementById('confirmPassword').value;

        if (!currentPass || !newPass || !confirmPass) {
            alert('אנא מלא את כל השדות');
            return;
        }

        if (newPass !== confirmPass) {
            alert('הסיסמאות אינן תואמות');
            return;
        }

        if (newPass.length < 6) {
            alert('הסיסמה חייבת להכיל לפחות 6 תווים');
            return;
        }

        logAudit('שינוי סיסמה', 'הסיסמה עודכנה בהצלחה');
        alert('הסיסמה שונתה בהצלחה!');

        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    }

    // Settings
    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
    }

    function toggleLayoutWidth(value) {
        if (value === 'boxed') {
            document.body.classList.add('boxed');
        } else {
            document.body.classList.remove('boxed');
        }
    }
    /**
     * מייצרת קובץ PDF מתוכן HTML נתון.
     * @param {string} title - הכותרת לשימוש בתוך הדוח ובשם הקובץ.
     * @param {string} htmlContent - מחרוזת ה-HTML המלאה של הדוח.
     * @param {string} type - סוג הדוח (לשם קובץ מדויק).
     */
    function generatePDF(reportTitle, htmlContent, reportType) {
        // 1. קביעת שם קובץ דינמי
        const filename = `${reportTitle}-${new Date().toLocaleDateString('he-IL').replace(/\./g, '_')}.pdf`;

        // 2. יצירת רכיב DOM זמני המכיל את תוכן הדוח
        const tempElement = document.createElement('div');
        tempElement.innerHTML = htmlContent;

        // 3. הגדרת אפשרויות הייצוא
        const options = {
            margin: [15, 10, 15, 10], // מרווחים (מ"מ)
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, logging: false, dpi: 192, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // 4. הפעלת הייצוא
        // שימוש ברכיב ה-DOM הזמני
        html2pdf().set(options).from(tempElement).save();
    }
    // Reports
    function exportReport(type) {
        let reportTitle, reportContent;

        switch (type) {
            case 'inventory':
                reportTitle = 'דוח מלאי מלא';
                reportContent = generateInventoryReport();
                break;
            case 'lowstock':
                reportTitle = 'דוח מוצרים חסרים';
                reportContent = generateLowStockReport();
                break;
            case 'usage':
                reportTitle = 'דוח תנועות במלאי';
                reportContent = generateUsageReport();
                break;
            case 'warehouse':
                reportTitle = 'דוח מחסנים';
                reportContent = generateWarehouseReport();
                break;
        }

        generatePDF(reportTitle, reportContent, type);
        logAudit('ייצוא דוח', `יוצא דוח ${reportTitle} בפורמט PDF`);
    }

    function generatePDF(title, content, type) {
        // Create a printable HTML document
        const printWindow = window.open('', '_blank');
        const currentDate = new Date().toLocaleDateString('he-IL');

        printWindow.document.write(`
                <!DOCTYPE html>
                <html dir="rtl" lang="he">
                <head>
                    <meta charset="UTF-8">
                    <title>${title}</title>
                    <style>
                        @page {
                            margin: 2cm;
                            size: A4;
                        }
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        body {
                            font-family: 'Arial', 'Helvetica', sans-serif;
                            direction: rtl;
                            line-height: 1.6;
                            color: #333;
                        }
                        .header {
                            text-align: center;
                            padding: 30px 0;
                            border-bottom: 3px solid #6366f1;
                            margin-bottom: 30px;
                        }
                        .header h1 {
                            font-size: 32px;
                            color: #6366f1;
                            margin-bottom: 10px;
                        }
                        .header .date {
                            font-size: 14px;
                            color: #666;
                        }
                        .summary {
                            background: linear-gradient(135deg, #f8fafc, #e2e8f0);
                            padding: 20px;
                            border-radius: 10px;
                            margin-bottom: 30px;
                            border-right: 4px solid #6366f1;
                        }
                        .summary h2 {
                            font-size: 20px;
                            margin-bottom: 15px;
                            color: #1e293b;
                        }
                        .summary-item {
                            display: flex;
                            justify-content: space-between;
                            padding: 8px 0;
                            border-bottom: 1px solid #cbd5e1;
                        }
                        .summary-item:last-child {
                            border-bottom: none;
                        }
                        .summary-label {
                            font-weight: bold;
                            color: #475569;
                        }
                        .summary-value {
                            color: #1e293b;
                            font-weight: 600;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 30px;
                            background: white;
                        }
                        thead {
                            background: linear-gradient(135deg, #6366f1, #4f46e5);
                            color: white;
                        }
                        th {
                            padding: 15px;
                            text-align: right;
                            font-weight: bold;
                            font-size: 14px;
                        }
                        td {
                            padding: 12px 15px;
                            text-align: right;
                            border-bottom: 1px solid #e2e8f0;
                        }
                        tbody tr:nth-child(even) {
                            background-color: #f8fafc;
                        }
                        tbody tr:hover {
                            background-color: #f1f5f9;
                        }
                        .critical {
                            background-color: #fee2e2 !important;
                            color: #dc2626;
                            font-weight: bold;
                        }
                        .warning {
                            background-color: #fef3c7 !important;
                            color: #d97706;
                        }
                        .success {
                            background-color: #d1fae5 !important;
                            color: #059669;
                        }
                        .badge {
                            display: inline-block;
                            padding: 4px 10px;
                            border-radius: 12px;
                            font-size: 12px;
                            font-weight: 600;
                        }
                        .badge-critical {
                            background: #fecaca;
                            color: #dc2626;
                        }
                        .badge-warning {
                            background: #fed7aa;
                            color: #d97706;
                        }
                        .badge-success {
                            background: #a7f3d0;
                            color: #059669;
                        }
                        .footer {
                            text-align: center;
                            padding-top: 30px;
                            margin-top: 50px;
                            border-top: 2px solid #e2e8f0;
                            color: #64748b;
                            font-size: 12px;
                        }
                        .section-title {
                            font-size: 22px;
                            color: #1e293b;
                            margin: 30px 0 20px 0;
                            padding-bottom: 10px;
                            border-bottom: 2px solid #6366f1;
                        }
                        @media print {
                            body {
                                print-color-adjust: exact;
                                -webkit-print-color-adjust: exact;
                            }
                            .no-print {
                                display: none;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${title}</h1>
                        <div class="date">תאריך: ${currentDate} | מערכת ניהול מלאי</div>
                    </div>
                    ${content}
                    <div class="footer">
                        <p>דוח זה הופק אוטומטית על ידי מערכת ניהול המלאי | ${currentDate}</p>
                        <p>© כל הזכויות שמורות</p>
                    </div>
                </body>
                </html>
            `);

        printWindow.document.close();


    }

    function generateInventoryReport() {
        const totalQty = products.reduce((sum, p) => sum + p.qty, 0);
        const totalValue = products.length;
        const avgQty = (totalQty / totalValue).toFixed(2);

        let html = `
        <div class="report-controls print-hide" style="text-align: left; margin-bottom: 20px;">
            <button class="export-btn" onclick="exportReportToPDF('InventoryReport')">
                <i class="fas fa-file-pdf"></i> ייצוא ל-PDF
            </button>
        </div>
        
        <div id="InventoryReport">
            <h1 style="text-align: center; margin-bottom: 20px;">דוח מלאי כללי</h1>
            <div class="summary">
                <h2>סיכום כללי</h2>
                <div class="summary-item">
                    <span class="summary-label">סה"כ מוצרים:</span>
                    <span class="summary-value">${totalValue}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">סה"כ יחידות במלאי:</span>
                    <span class="summary-value">${totalQty}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">ממוצע יחידות למוצר:</span>
                    <span class="summary-value">${avgQty}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">מספר מחסנים:</span>
                    <span class="summary-value">${warehouses.length}</span>
                </div>
            </div>
            
            <h2 class="section-title">פירוט מלאי מלא</h2>
            <table>
                <thead>
                    <tr>
                        <th>שם מוצר</th>
                        <th>סוג</th>
                        <th>כמות מינימלית</th>
                        <th>כמות זמינה</th>
                        <th>מחסן</th>
                        <th>סטטוס</th>
                    </tr>
                </thead>
                <tbody>
    `;

        products.forEach(p => {
            const status = p.qty === 0 ? 'אזל' : p.qty <= p.min ? 'חסר' : 'תקין';
            const statusClass = p.qty === 0 ? 'critical' : p.qty <= p.min ? 'warning' : 'success';

            html += `
                    <tr class="${statusClass}">
                        <td><strong>${p.name}</strong></td>
                        <td>${p.type}</td>
                        <td>${p.min}</td>
                        <td><strong>${p.qty}</strong></td>
                        <td>${p.warehouse}</td>
                        <td><span class="badge badge-${statusClass}">${status}</span></td>
                    </tr>
        `;
        });

        html += '</tbody></table>';

        // סגירת מכולת הייצוא
        html += '</div>';
        return html;
    }

    function generateLowStockReport() {
        const lowStockProducts = products.filter(p => p.qty <= p.min);
        const criticalProducts = products.filter(p => p.qty === 0);

        let html = `
        <div class="report-controls print-hide" style="text-align: left; margin-bottom: 20px;">
            <button class="export-btn export-pdf-btn" onclick="exportReportToPDF('LowStockReport')">
                <i class="fas fa-file-pdf"></i> ייצוא ל-PDF
            </button>
        </div>
        
        <div id="LowStockReport">
            <h1 style="text-align: center; margin-bottom: 20px;">דוח מלאי חסר / אזל</h1>
            <div class="summary">
                <h2>סיכום מצב מלאי</h2>
                <div class="summary-item">
                    <span class="summary-label">מוצרים תחת המינימום:</span>
                    <span class="summary-value" style="color: #d97706;">${lowStockProducts.length}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">מוצרים שאזלו:</span>
                    <span class="summary-value" style="color: #dc2626;">${criticalProducts.length}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">סה"כ יחידות חסרות:</span>
                    <span class="summary-value">${lowStockProducts.reduce((sum, p) => sum + (p.min - p.qty), 0)}</span>
                </div>
            </div>
            
            <h2 class="section-title">מוצרים הדורשים הזמנה מיידית</h2>
            <table>
                <thead>
                    <tr>
                        <th>שם מוצר</th>
                        <th>סוג</th>
                        <th>כמות זמינה</th>
                        <th>כמות מינימלית</th>
                        <th>נדרש להזמין</th>
                        <th>מחסן</th>
                        <th>דחיפות</th>
                    </tr>
                </thead>
                <tbody>
    `;

        lowStockProducts.sort((a, b) => a.qty - b.qty).forEach(p => {
            const shortage = p.min - p.qty;
            const urgency = p.qty === 0 ? 'קריטי' : 'דחוף';
            const urgencyClass = p.qty === 0 ? 'critical' : 'warning';

            html += `
                    <tr class="${urgencyClass}">
                        <td><strong>${p.name}</strong></td>
                        <td>${p.type}</td>
                        <td><strong>${p.qty}</strong></td>
                        <td>${p.min}</td>
                        <td><strong>${shortage}</strong></td>
                        <td>${p.warehouse}</td>
                        <td><span class="badge badge-${urgencyClass}">${urgency}</span></td>
                    </tr>
        `;
        });

        html += '</tbody></table>';

        // סגירת מכולת הייצוא
        html += '</div>';
        return html;
    }

    /**
     * מייצאת אלמנט DOM ספציפי ל-PDF באמצעות html2pdf.
     * @param {string} reportId - ה-ID של האלמנט המכיל את תוכן הדוח.
     *//**
    * מייצאת אלמנט DOM ספציפי ל-PDF באמצעות html2pdf.
    * @param {string} reportId - ה-ID של האלמנט המכיל את תוכן הדוח (למשל: 'LowStockReport').
    */
    function exportReportToPDF(reportId) {
        const element = document.getElementById(reportId);

        if (!element) {
            alert("שגיאה: תוכן הדוח (" + reportId + ") לא נמצא ב-HTML.");
            return;
        }

        // קביעת שם קובץ דינמי
        let reportName = 'דוח-מלאי';
        if (reportId === 'LowStockReport') reportName = 'דוח-מלאי-חסר';
        // ניתן להוסיף כאן סוגי דוחות נוספים: else if (reportId === 'InventoryReport') reportName = 'דוח-מלאי-כללי';

        const options = {
            margin: [15, 10, 15, 10], // מרווחים (מ"מ)
            filename: reportName + '-' + new Date().toLocaleDateString('he-IL').replace(/\./g, '_') + '.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, logging: false, dpi: 192, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // הפעלת הייצוא
        html2pdf().set(options).from(element).save();
    }

    function generateUsageReport() {
        let html = `
        <div class="report-controls print-hide" style="text-align: left; margin-bottom: 20px;">
            <button class="export-btn" onclick="exportReportToPDF('UsageReport')">
                <i class="fas fa-file-pdf"></i> ייצוא ל-PDF
            </button>
        </div>
        
        <div id="UsageReport">
            <h1 style="text-align: center; margin-bottom: 20px;">דוח תנועות במלאי</h1>
            <div class="summary">
                <h2>סיכום תנועות</h2>
                <div class="summary-item">
                    <span class="summary-label">סה"כ פעולות מתועדות:</span>
                    <span class="summary-value">${auditLog.length}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">תאריך דוח:</span>
                    <span class="summary-value">${new Date().toLocaleDateString('he-IL')}</span>
                </div>
            </div>
            
            <h2 class="section-title">היסטוריית תנועות במלאי</h2>
            <table>
                <thead>
                    <tr>
                        <th>תאריך ושעה</th>
                        <th>משתמש</th>
                        <th>סוג פעולה</th>
                        <th>פרטים</th>
                    </tr>
                </thead>
                <tbody>
    `;

        auditLog.slice(0, 50).forEach(log => {
            html += `
                    <tr>
                        <td>${log.timestamp}</td>
                        <td><strong>${log.username || log.user}</strong> ${log.fullName ? `(${log.fullName})` : ''}</td>
                        <td><span class="badge badge-success">${log.action}</span></td>
                        <td>${log.details}</td>
                    </tr>
        `;
        });

        html += '</tbody></table>';

        if (auditLog.length > 50) {
            html += `<p style="text-align: center; color: #64748b; margin-top: 20px;">מוצגות 50 הפעולות האחרונות מתוך ${auditLog.length}</p>`;
        }

        // סגירת מכולת הייצוא
        html += '</div>';
        return html;
    }
    function generateWarehouseReport() {
        const warehouseStats = warehouses.map(w => {
            const warehouseProducts = products.filter(p => p.warehouse === w.name);
            const totalQty = warehouseProducts.reduce((sum, p) => sum + p.qty, 0);
            const lowStock = warehouseProducts.filter(p => p.qty <= p.min).length;

            return {
                name: w.name,
                productCount: warehouseProducts.length,
                totalQty: totalQty,
                lowStock: lowStock
            };
        });

        let html = `
        <div class="report-controls print-hide" style="text-align: left; margin-bottom: 20px;">
            <button class="export-btn" onclick="exportReportToPDF('WarehouseReport')">
                <i class="fas fa-file-pdf"></i> ייצוא ל-PDF
            </button>
        </div>
        
        <div id="WarehouseReport">
            <h1 style="text-align: center; margin-bottom: 20px;">דוח התפלגות מלאי לפי מחסנים</h1>
            <div class="summary">
                <h2>סיכום כללי</h2>
                <div class="summary-item">
                    <span class="summary-label">סה"כ מחסנים:</span>
                    <span class="summary-value">${warehouses.length}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">סה"כ מוצרים:</span>
                    <span class="summary-value">${products.length}</span>
                </div>
            </div>
            
            <h2 class="section-title">התפלגות מלאי לפי מחסנים</h2>
            <table>
                <thead>
                    <tr>
                        <th>שם מחסן</th>
                        <th>מספר מוצרים</th>
                        <th>סה"כ יחידות</th>
                        <th>מוצרים חסרים</th>
                    </tr>
                </thead>
                <tbody>
    `;

        warehouseStats.forEach(w => {
            html += `
                    <tr>
                        <td><strong>${w.name}</strong></td>
                        <td>${w.productCount}</td>
                        <td><strong>${w.totalQty}</strong></td>
                        <td><span class="badge ${w.lowStock > 0 ? 'badge-warning' : 'badge-success'}">${w.lowStock}</span></td>
                    </tr>
        `;
        });

        html += '</tbody></table>';

        // Add detailed breakdown per warehouse
        html += '<h2 class="section-title">פירוט מפורט לפי מחסנים</h2>';

        warehouses.forEach(w => {
            const warehouseProducts = products.filter(p => p.warehouse === w.name);

            html += `
                    <h3 style="margin: 30px 0 15px 0; color: #6366f1; font-size: 18px;">📦 ${w.name}</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>שם מוצר</th>
                                <th>סוג</th>
                                <th>כמות זמינה</th>
                                <th>כמות מינימלית</th>
                                <th>סטטוס</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            warehouseProducts.forEach(p => {
                const status = p.qty <= p.min ? 'חסר' : 'תקין';
                const statusClass = p.qty <= p.min ? 'warning' : 'success';

                html += `
                        <tr class="${statusClass}">
                            <td><strong>${p.name}</strong></td>
                            <td>${p.type}</td>
                            <td><strong>${p.qty}</strong></td>
                            <td>${p.min}</td>
                            <td><span class="badge badge-${statusClass}">${status}</span></td>
                        </tr>
            `;
            });

            html += '</tbody></table>';
        });

        // סגירת מכולת הייצוא
        html += '</div>';
        return html;
    }
    function sendAdminMessage() {
        const message = document.getElementById('adminMessage').value;
        if (!message) {
            alert('אנא כתוב הודעה');
            return;
        }

        localStorage.setItem('adminWelcomeMessage', message);
        localStorage.removeItem('adminWelcomeShown');
        alert('ההודעה נשלחה בהצלחה! כל המשתמשים יראו אותה בכניסה הבאה.');
        document.getElementById('adminMessage').value = '';

        logAudit('הודעת מערכת', 'נשלחה הודעת מערכת לכל המשתמשים');
    }

    function checkAdminWelcome() {
        const message = localStorage.getItem('adminWelcomeMessage');
        const shown = localStorage.getItem('adminWelcomeShown');

        if (message && !shown) {
            document.getElementById('adminWelcomeMessage').innerHTML = `<p style="font-size: 16px;">${message}</p>`;
            document.getElementById('adminWelcomeModal').classList.add('show');
        }
    }

    function closeAdminWelcome() {
        document.getElementById('adminWelcomeModal').classList.remove('show');
        localStorage.setItem('adminWelcomeShown', 'true');
    }

    // Backup
    function createBackup() {
        const backup = {
            date: new Date().toISOString(),
            products: products,
            auditLog: auditLog,
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_${new Date().toLocaleDateString('he-IL').replace(/\./g, '_')}.json`;
        a.click();

        logAudit('גיבוי', 'נוצר גיבוי מלא של המערכת');
        alert('הגיבוי נוצר בהצלחה!');
    }

    // User Management
    function showAddUserModal() {
        const username = prompt('הזן שם משתמש חדש:');
        if (username) {
            alert(`משתמש "${username}" נוסף בהצלחה. המשתמש יתבקש לבחור סיסמה בכניסה הראשונה.`);
            logAudit('יצירת משתמש', `נוצר משתמש חדש "${username}"`);
        }
    }

    // Logout
    function logout() {
        if (confirm('האם אתה בטוח שברצונך להתנתק?')) {
            logAudit('התנתקות', 'משתמש התנתק מהמערכת');
            alert('התנתקת בהצלחה');
            location.reload();
        }
    }

    // Close dropdowns on outside click
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.user-profile')) {
            document.getElementById('userDropdown').classList.remove('show');
        }
        if (!e.target.closest('.notification-panel') && !e.target.closest('[onclick="toggleNotifications()"]')) {
            document.getElementById('notificationPanel').classList.remove('show');
        }
        if (!e.target.closest('.modal-content') && e.target.classList.contains('modal')) {
            closeEditModal();
        }
    });
});