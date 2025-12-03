
const pageCenter = document.getElementById('page-center');
const pageRegister = document.getElementById('page-register');
const ownerOptions = document.getElementById('owner-options');
const companyOptions = document.getElementById('company-options');
const managementPage = document.getElementById('management');
const products = document.getElementById('products');
const product = document.getElementById('product');
const commandsPage = document.getElementById('commands-page');
const commandsBtn = document.getElementById('commands');
const backCommands = document.getElementById('back-commands');
const commandDetailsPage = document.getElementById('command-details-page');
const backToCommands = document.getElementById('back-to-commands');
const saveCommandBtn = document.getElementById('save-command');
const rejectCommandBtn = document.getElementById('reject-command');
const ignoreCommandBtn = document.getElementById('ignore-command');
const activeToggleBtn = document.getElementById('active-toggle');
const activeToggleBtn1 = document.getElementById("pharma-active-toggle");
const pharmaOptions = document.getElementById('pharma-options');
const pharmaCompaniesPage = document.getElementById('pharma-companies');
const createCommandPage = document.getElementById('create-command-page');
const pharmaProducts = document.getElementById('pharma-products');
const companyPharmaList = document.getElementById('company-pharma-list');
const createPharmaCommandPage = document.getElementById('create-pharma-command-page');

let names = "";
let currentUser = "";
let currentCommandId = "";
let currentCommandState = "";
let currentActiveState = true;
let currentCreatingCompany = "";
let currentCreatingPharma = "";
let ignoretext = "";
let storedType = "";

// Buttons
const loginBtn = document.getElementById('submit');
const registerBtn = document.getElementById('register');
const newUsersBtn = document.getElementById('newUsersBtn');
const usersBtn = document.getElementById('usersBtn');
const backManagement = document.getElementById('back-management');
const backManagement1 = document.getElementById('back-management1');
const backProduct = document.getElementById('back-product');
const save = document.getElementById('save');
const addProduct = document.getElementById('addProduct');
const final = document.getElementById('final');
const typeSelect = document.getElementById('options');
const checkboxGroup = document.getElementById('checkboxg');
const dates = document.getElementById('dates');

// =========================
// Global Variables & Listeners
// =========================
let allProductsForCommand = [];
let allProducts = [];
let allPharmaProducts = [];
let allPharmaProductsForCommand = [];
let pharmaProductsListener = null;
let userActiveStateListener = null;
let clickDebounceTimers = {};

// =========================
// Utility Functions
// =========================
function showPage(page) {
  const allPages = [
    pageCenter, pageRegister, ownerOptions, companyOptions, 
    managementPage, products, commandsPage, commandDetailsPage, 
    pharmaOptions, pharmaCompaniesPage, createCommandPage,
    pharmaProducts, companyPharmaList, createPharmaCommandPage, historyPage
  ];
  
  allPages.forEach(p => {
    if (p) p.classList.add('hidden');
  });
  
  if (page) page.classList.remove('hidden');
}

function alertError(msg) {
  alert(`❌ ${msg}`);
}

function alertSuccess(msg) {
  alert(`✅ ${msg}`);
}

function debounceClick(elementId, callback, delay = 1000) {
  if (clickDebounceTimers[elementId]) {
    return;
  }
  
  clickDebounceTimers[elementId] = setTimeout(() => {
    delete clickDebounceTimers[elementId];
  }, delay);
  
  callback();
}

async function getServerTime() {
  try {
    const ref = db.collection("serverTime").doc("time");
    await ref.set({ now: firebase.firestore.FieldValue.serverTimestamp() });
    const doc = await ref.get();
    return doc.data().now.toDate();
  } catch (err) {
    console.error('Error getting server time:', err);
    return new Date(); // Fallback to local time
  }
}

// =========================
// Real-time Data Listeners
// =========================
function setupPharmaProductsListener(pharmaName) {
  return db.collection('users')
    .doc(pharmaName)
    .collection('products')
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'modified') {
          const updatedProduct = change.doc.data();
          const productName = change.doc.id;
          
          // Update the max value in the create command page
          const input = document.querySelector(`.qte-input[data-product="${productName}"]`);
          if (input) {
            const currentValue = parseInt(input.value) || 0;
            const newMax = updatedProduct.qte || 0;
            
            input.max = newMax;
            
            // Also update the displayed max text
            const maxText = input.closest('.command-item').querySelector('.command-product-max');
            if (maxText) {
              maxText.textContent = `Max: ${newMax}`;
            }
            
            // Adjust current value if it exceeds new max
            if (currentValue > newMax) {
              input.value = newMax;
              
              // Update the global array
              const productIndex = allPharmaProductsForCommand.findIndex(p => p.name === productName);
              if (productIndex !== -1) {
                allPharmaProductsForCommand[productIndex].quantity = newMax;
                allPharmaProductsForCommand[productIndex].qte = newMax;
              }
            }
          }
        }
      });
    }, error => {
      console.error('Pharma products listener error:', error);
    });
}

function setupUserActiveStateListener(userName) {
  return db.collection('users')
    .doc(userName)
    .onSnapshot(doc => {
      if (doc.exists) {
        const data = doc.data();
        const newActiveState = data.active !== undefined ? data.active : true;
        
        if (newActiveState !== currentActiveState) {
          currentActiveState = newActiveState;
          updateActiveButton();
          
          // Show notification if user was deactivated
          if (!newActiveState && document.contains(activeToggleBtn)) {
            alertError('Your account has been deactivated. Please contact administrator.');
          }
        }
      }
    }, error => {
      console.error('User active state listener error:', error);
    });
}

function cleanupListeners() {
  if (pharmaProductsListener) {
    pharmaProductsListener();
    pharmaProductsListener = null;
  }
  if (userActiveStateListener) {
    userActiveStateListener();
    userActiveStateListener = null;
  }
}

// =========================
// Active State Functions
// =========================
async function loadActiveState(userName) {
  try {
    const userDoc = await db.collection('users').doc(userName).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      currentActiveState = data.active !== undefined ? data.active : true;
      updateActiveButton();
    }
  } catch (err) {
    console.error('Error loading active state:', err);
  }
}

function updateActiveButton() {
  if (activeToggleBtn && document.contains(activeToggleBtn)) {
    if (currentActiveState) {
      activeToggleBtn.textContent = 'Active';
      activeToggleBtn.classList.remove('inactive');
    } else {
      activeToggleBtn.textContent = 'Inactive';
      activeToggleBtn.classList.add('inactive');
    }
  }
  
  if (activeToggleBtn1 && document.contains(activeToggleBtn1)) {
    if (currentActiveState) {
      activeToggleBtn1.textContent = 'Active';
      activeToggleBtn1.classList.remove('inactive');
    } else {
      activeToggleBtn1.textContent = 'Inactive';
      activeToggleBtn1.classList.add('inactive');
    }
  }
}

async function toggleActiveState1() {
  debounceClick('activeToggle', async () => {
    try {
      // Check if there are active products before allowing activation
      if (!currentActiveState) {
        const userDoc = await db.collection('users').doc(names).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          
          if (userData.type === 'company') {
            const productsSnapshot = await db.collection('users')
              .doc(names)
              .collection('products')
              .where('exist', '==', true)
              .get();
            
            if (productsSnapshot.empty) {
              alertError('Cannot activate: No active products found. Please add at least one active product.');
              return;
            }
          } else if (userData.type === 'Pharma') {
            const productsSnapshot = await db.collection('users')
              .doc(names)
              .collection('products')
              .where('qte', '>', 0)
              .get();
            
            if (productsSnapshot.empty) {
              alertError('Cannot activate: No products with quantity > 0 found. Please add quantity to at least one product.');
              return;
            }
          }
        }
      }

      const confirmToggle = confirm(
        `Are you sure you want to change status to ${currentActiveState ? 'Inactive' : 'Active'}?`
      );
      if (!confirmToggle) return;

      const toggleBtn = activeToggleBtn || activeToggleBtn1;
      if (toggleBtn) {
        toggleBtn.disabled = true;
        toggleBtn.textContent = 'Updating...';
      }

      await db.collection('users').doc(names).update({
        active: !currentActiveState
      });

      currentActiveState = !currentActiveState;
      updateActiveButton();
      alertSuccess('Status updated successfully!');
      
      if (toggleBtn) {
        toggleBtn.disabled = false;
        updateActiveButton();
      }
    } catch (err) {
      console.error('Error toggling active state:', err);
      alertError('Failed to update status');
      const toggleBtn = activeToggleBtn || activeToggleBtn1;
      if (toggleBtn) {
        toggleBtn.disabled = false;
        updateActiveButton();
      }
    }
  });
}

// =========================
// Login
// =========================
async function login() {
  debounceClick('login', async () => {
    const name = document.getElementById('name1').value.trim();
    const password = document.getElementById('password1').value.trim();

    if (!name || !password) return alertError('Please enter both name and password.');
    if (password.length !== 8) return alertError('Password must be exactly 8 characters.');

    try {
      const userDoc = await db.collection('users').doc(name).get();
      if (!userDoc.exists) return alertError('User does not exist!');

      const data = userDoc.data();
      if (data.password !== password) return alertError('Incorrect password.');

      storedType = data.type;
      const expireAt = data.expireAt ? data.expireAt.toDate() : null;
      const isBlocked = data.block === true;

      if (isBlocked) return alertError('Account is blocked.');

      if (name === 'owner') {
        showPage(ownerOptions);
        return;
      }

      if (storedType === 'company') {
        const serverTime = await getServerTime();
        if (!expireAt || serverTime > expireAt) {
          alertError('Access denied! Company account expired.');
          return;
        }

        currentUser = name;
        names = currentUser;
        showPage(companyOptions);
      } else if (storedType === 'Pharma') {
        await handlePharmaLogin(name, data);
      } else {
        alertError('User type not supported.');
      }

    } catch (err) {
      console.error(err);
      alertError('Error checking user.');
    }
  });
}

// =========================
// Pharma Login Handler
// =========================
async function handlePharmaLogin(name, data) {
  const isBlocked = data.block === true;

  if (isBlocked) {
    alertError('Account is blocked.');
    return;
  }

  currentUser = name;
  names = currentUser;
  showPage(pharmaOptions);
}

// =========================
// Register
// =========================
async function registerUser() {
  debounceClick('register', async () => {
    const name = document.getElementById('name2').value.trim();
    const password = document.getElementById('password2').value.trim();
    const type = typeSelect.value;
    const active = document.getElementById('checkbox').checked;

    if (!name || !password) return alertError('Please enter both name and password.');
    if (password.length !== 8) return alertError('Password must be exactly 8 characters.');

    const userRef = db.collection('users').doc(name);

    try {
      const userDoc = await db.collection('users').doc(name).get();
      if (userDoc.exists) return alertError('User already exist!');
      
      loginBtn.disabled = true;
      loginBtn.textContent = 'Registering...';
      
      await userRef.set({
        password,
        type,
        block: false,
        active: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      const snap = await userRef.get();
      const createdAt = snap.data().createdAt.toDate();
      const expireAt = active ? new Date(createdAt.setMonth(createdAt.getMonth() + 1)) : createdAt;

      await userRef.update({ expireAt });
      alertSuccess('User registered successfully');
      
      document.getElementById('name2').value = '';
      document.getElementById('password2').value = '';
      document.getElementById('checkbox').checked = false;
    } catch (err) {
      console.error(err);
      alertError('Error registering user');
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Se connecter';
    }
  });
}

// =========================
// Load Users
// =========================
async function loadUsers() {
  debounceClick('loadUsers', async () => {
    const container = document.getElementById('userCards');
    container.innerHTML = '';

    try {
      const serverTime = await getServerTime();
      const snapshot = await db.collection('users').get();

      if (snapshot.empty) {
        container.innerHTML = `<p class="empty-message">No users found 🧙‍♂️</p>`;
        showPage(managementPage);
        return;
      }

      snapshot.forEach(doc => {
        const name = doc.id;
        if (name === 'owner') return;

        const data = doc.data();
        const type = data.type || '—';
        const password = data.password || '—';
        const expireAt = data.expireAt ? data.expireAt.toDate() : null;
        const isBlocked = data.block === true;

        let expireLabel = 'None';
        let expireClass = 'deactive';
        if (type === 'company' && expireAt) {
          if (serverTime < expireAt) {
            expireLabel = 'Active';
            expireClass = 'active';
          } else {
            expireLabel = 'DeActive';
            expireClass = 'deactive';
          }
        }

        const statusText = isBlocked ? 'Blocked' : 'Active';
        const statusClass = isBlocked ? 'blocked' : 'active';

        const card = document.createElement('div');
        card.className = 'carde';
        card.innerHTML = `
          <h3>${name}</h3>
          <p><span class="label">Type:</span> ${type}</p>
          <p><span class="label">Password:</span> ${password}</p>
          <p><span class="label">Expire:</span> <span class="Expire ${expireClass}" style="cursor:pointer;">${expireLabel}</span></p>
          <p><span class="label">Status:</span> <span class="status ${statusClass}" style="cursor:pointer;">${statusText}</span></p>
        `;

        // Renew expire
        const expireEl = card.querySelector('.Expire');
        if (type === 'company' && expireLabel === 'DeActive') {
          expireEl.addEventListener('click', async () => {
            debounceClick(`renew-${name}`, async () => {
              if (confirm('Renew this company for 1 month?')) {
                const newExpire = new Date(serverTime);
                newExpire.setMonth(newExpire.getMonth() + 1);
                await db.collection('users').doc(name).update({ expireAt: newExpire });
                alertSuccess('Company renewed for +1 month');
                loadUsers();
              }
            });
          });
        }

        // Block / unblock
        const statusEl = card.querySelector('.status');
        statusEl.addEventListener('click', async () => {
          debounceClick(`block-${name}`, async () => {
            const confirmMsg = isBlocked ? 'Unblock this user?' : 'Block this user?';
            if (confirm(confirmMsg)) {
              await db.collection('users').doc(name).update({ block: !isBlocked });
              alertSuccess(`User ${!isBlocked ? 'blocked' : 'unblocked'}`);
              loadUsers();
            }
          });
        });

        container.appendChild(card);
      });

      showPage(managementPage);
    } catch (err) {
      console.error(err);
      alertError('Failed to load users');
    }
  });
}

// =========================
// Load Products
// =========================
async function loadProducts(userName) {
  await loadActiveState(userName);
  
  const left = document.getElementById("leftItems");
  const right = document.getElementById("rightItems");
  const pageCounter = document.getElementById("pageCounter");
  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");

  let currentPage = 1;
  const itemsPerPage = 20;
  let allItems = [];
  let showOnlyActive = false;

  async function fetchItems() {
    left.innerHTML = "";
    right.innerHTML = "";

    try {
      const snapshot1 = await db.collection("users").doc(userName).get();
      const prodtime = snapshot1.data().prodtime;
      await loadActiveState(userName);

      if (prodtime) {
        const date = prodtime.toDate();
        const formatted = date.toISOString().split("T")[0];
        dates.value = formatted;
      }

      const snapshot = await db.collection("users").doc(userName)
        .collection("products")
        .orderBy(firebase.firestore.FieldPath.documentId())
        .get();

      if (snapshot.empty) {
        left.innerHTML = `<p class="empty-message">No products yet 📦</p>`;
        right.innerHTML = "";
        pageCounter.textContent = "0 / 0";
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
      }

      allItems = snapshot.docs.map(doc => doc.data());
      renderPage();
    } catch (error) {
      console.error("Error fetching items:", error);
      alertError("Failed to load products");
    }
  }

  function renderPage() {
    left.innerHTML = "";
    right.innerHTML = "";

    const visibleItems = showOnlyActive
      ? allItems.filter(item => item.exist)
      : allItems;

    const totalPages = Math.ceil(visibleItems.length / itemsPerPage);
    pageCounter.textContent = `${currentPage} / ${totalPages || 1}`;

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;

    const start = (currentPage - 1) * itemsPerPage;
    const currentItems = visibleItems.slice(start, start + itemsPerPage);

    currentItems.forEach((itemObj, index) => {
      const div = document.createElement("div");
      div.className = "item";
      
      const span = document.createElement('span');
      span.textContent = itemObj.name;
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `chk_${itemObj.name.replace(/\s+/g, '_')}`;
      checkbox.dataset.name = itemObj.name;
      checkbox.checked = itemObj.exist;
      
      checkbox.addEventListener('change', function() {
        const productName = this.dataset.name;
        const itemIndex = allItems.findIndex(item => item.name === productName);
        if (itemIndex !== -1) {
          allItems[itemIndex].exist = this.checked;
        }
        save.classList.remove('hidden');
        addProduct.classList.add('hidden');
        final.classList.add('hidden');
      });

      div.appendChild(span);
      div.appendChild(checkbox);

      if (index < 10) left.appendChild(div);
      else right.appendChild(div);
    });

    if (visibleItems.length === 0) {
      left.innerHTML = `<p class="empty-message">No active products left 🧹</p>`;
      right.innerHTML = "";
    }
  }

  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderPage();
    }
  };

  nextBtn.onclick = () => {
    const totalPages = Math.ceil(
      (showOnlyActive ? allItems.filter(i => i.exist).length : allItems.length) / itemsPerPage
    );
    if (currentPage < totalPages) {
      currentPage++;
      renderPage();
    }
  };

  addProduct.onclick = async () => {
    debounceClick('addProduct', async () => {
      const newName = prompt("Enter new product name:");
      if (!newName) return;

      try {
        const ref = db.collection("users")
          .doc(userName)
          .collection("products")
          .doc(newName);

        await ref.set({
          name: newName,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          exist: true
        });

        alertSuccess("Product added ✅");
        fetchItems();
      } catch (error) {
        console.error("Error adding product:", error);
        alertError("Failed to add product");
      }
    });
  };

  save.onclick = async () => {
    debounceClick('saveProducts', async () => {
      try {
        if(dates.value == ""){
          alertError("Please enter the date");
          return;
        }
        const confirmSave = confirm("Are you sure you want to save changes?");
        if (!confirmSave) return;

        save.disabled = true;
        addProduct.disabled = true;
        save.textContent = "Saving...";

        // Check if all items are inactive
        const allInactive = allItems.every(item => !item.exist);
        
        const updates = [];
        const userRef = db.collection('users').doc(names);

        await userRef.update({
          prodtime: new Date(dates.value),
        });
        
        // Update active state based on products
        if(!allInactive == false){
          await userRef.update({
          active: !allInactive // Set active to false if all items are inactive
        });
        }
        

        allItems.forEach(item => {
          const ref = db.collection("users")
            .doc(userName)
            .collection("products")
            .doc(item.name);
          updates.push(ref.update({ exist: item.exist }));
        });

        await Promise.all(updates);

        // Update current active state
        currentActiveState = !allInactive;
        updateActiveButton();

        alertSuccess("✅ Changes saved successfully!");
        save.disabled = false;
        addProduct.disabled = false;
        save.textContent = "Save";
        save.classList.add('hidden');
        final.classList.remove('hidden');
        fetchItems();
      } catch (error) {
        console.error("Error saving:", error);
        alertError("❌ Failed to save changes.");
        save.disabled = false;
        addProduct.disabled = false;
        save.textContent = "Save";
      }
    });
  };

  final.onclick = () => {
    showOnlyActive = !showOnlyActive;
    currentPage = 1;
    final.textContent = showOnlyActive ? "Show Inactive" : "Hide Inactive";
    renderPage();
  };

  fetchItems();
}

// =========================
// Unified Load Commands Function
// =========================
async function loadCommands(userName) {
  const container = document.getElementById('commandsContainer');
  container.innerHTML = '<p class="empty-message">Loading commands...</p>';

  try {
    const userDoc = await db.collection('users').doc(userName).get();
    if (!userDoc.exists) {
      alertError('User not found');
      return;
    }

    const userData = userDoc.data();
    let commandsSnapshot;

    if (userData.type === 'company') {
      commandsSnapshot = await db.collection('commands')
        .where('company', '==', userName)
        .where('companystate', '==', true)
        .orderBy('created')
        .get();
    } else if (userData.type === 'Pharma') {
      commandsSnapshot = await db.collection('commands')
        .where('pharma', '==', userName)
        .where('pharmastate', '==', true)
        .orderBy('created')
        .get();
    } else {
      alertError('Invalid user type');
      return;
    }

    if (commandsSnapshot.empty) {
      container.innerHTML = '<p class="empty-message">No commands found 📋</p>';
      showPage(commandsPage);
      return;
    }

    container.innerHTML = '';

    for (const doc of commandsSnapshot.docs) {
      const commandData = doc.data();
      
      let cardContent = '';
      let shouldShowCard = true;
      
      if (userData.type === 'company') {
        const pharmaName = commandData.pharma;
        if (!pharmaName) continue;

        const pharmaDoc = await db.collection('users').doc(pharmaName).get();
        if (!pharmaDoc.exists) continue;
        
        const pharmaData = pharmaDoc.data();
        const isBlocked = pharmaData.block === true;

        if (!isBlocked) {
          cardContent = `
            <h3>Code : ${doc.id}</h3>
            <div class="pharma-name">${pharmaName}</div>
            <div class="pharma-info">state : ${commandData.state}</div>
            <div class="click-hint">Click to view details</div>
          `;
        } else {
          shouldShowCard = false;
        }
      } else if (userData.type === 'Pharma') {
        cardContent = `
          <h3>Code : ${doc.id}</h3>
          <div class="pharma-name">${commandData.company}</div>
          <div class="pharma-info">State: ${commandData.state}</div>
          <div class="pharma-info">Created: ${commandData.created ? commandData.created.toDate().toLocaleDateString() : 'N/A'}</div>
          <div class="click-hint">Click to view details</div>
        `;
      }

      if (shouldShowCard && cardContent) {
        const card = document.createElement('div');
        card.className = 'command-card';
        card.innerHTML = cardContent;

        card.addEventListener('click', () => {
          if (userData.type === 'company') {
            loadCommandDetails(doc.id, commandData.state);
          } else if (userData.type === 'Pharma') {
            loadPharmaCommandDetails(doc.id, commandData.state);
          }
        });

        container.appendChild(card);
      }
    }

    if (container.children.length === 0) {
      container.innerHTML = '<p class="empty-message">No commands available 🔭</p>';
    }

    showPage(commandsPage);

  } catch (err) {
    console.error('Error loading commands:', err);
    alertError('Failed to load commands');
    container.innerHTML = '<p class="empty-message">Error loading commands ❌</p>';
  }
}

// =========================
// Load Command Details (Company View)
// =========================
async function loadCommandDetails(commandId, state) {
  currentCommandId = commandId;
  currentCommandState = state;
  
  const left = document.getElementById('leftCommandItems');
  const right = document.getElementById('rightCommandItems');
  const title = document.getElementById('command-title');
  const pageCounter = document.getElementById('commandPageCounter');
  const prevBtn = document.getElementById('prevCommandPage');
  const nextBtn = document.getElementById('nextCommandPage');
  
  if (!left || !right || !title || !pageCounter || !prevBtn || !nextBtn) {
    console.error('One or more required elements not found');
    alertError('Page elements not found');
    return;
  }
  
  let currentPage = 1;
  const itemsPerPage = 20;
  allProducts = []; // Reset global array
  
  left.innerHTML = '<p class="empty-message">Loading...</p>';
  right.innerHTML = '';
  
  saveCommandBtn.classList.add('hidden');
  rejectCommandBtn.classList.add('hidden');
  ignoreCommandBtn.classList.add('hidden');
  
  try {
    const productsSnapshot = await db.collection('commands')
      .doc(commandId)
      .collection('product')
      .get();
    
    if (productsSnapshot.empty) {
      left.innerHTML = '<p class="empty-message">No products in this command 📦</p>';
      right.innerHTML = '';
      pageCounter.textContent = '0 / 0';
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      showPage(commandDetailsPage);
      return;
    }
    
    title.textContent = `Commande : ${commandId}`;
    
    productsSnapshot.forEach(doc => {
      const data = doc.data();
      allProducts.push({
        name: data.name,
        qte: data.qte || 0,
        dqte: data.dqte || 0,
        inputValue: null,
        modified: false // Track if user has modified this product
      });
    });
    
    function saveCurrentPageInputs() {
      // Save all input values before changing page
      const inputs = document.querySelectorAll('#command-details-page .qte-input');
      inputs.forEach(input => {
        const productName = input.dataset.product;
        const quantity = parseInt(input.value) || 0;
        const productIndex = allProducts.findIndex(p => p.name === productName);
        if (productIndex !== -1) {
          allProducts[productIndex].inputValue = quantity;
          // Mark as modified if user has interacted with it
          allProducts[productIndex].modified = true;
        }
      });
    }
    
    function renderCommandPage() {
      // Save current page inputs before rendering
      saveCurrentPageInputs();
      
      ignoretext = "companystate";
      left.innerHTML = '';
      right.innerHTML = '';
      
      const totalPages = Math.ceil(allProducts.length / itemsPerPage);
      pageCounter.textContent = `${currentPage} / ${totalPages || 1}`;
      
      // Update button states
      const currentPrevBtn = document.getElementById('prevCommandPage');
      const currentNextBtn = document.getElementById('nextCommandPage');
      
      if (currentPrevBtn) currentPrevBtn.disabled = currentPage === 1;
      if (currentNextBtn) currentNextBtn.disabled = currentPage === totalPages || totalPages === 0;
      
      const start = (currentPage - 1) * itemsPerPage;
      const currentItems = allProducts.slice(start, start + itemsPerPage);
      const halfLength = Math.ceil(currentItems.length / 2);
      
      if (state === 'demand') {
        saveCommandBtn.classList.remove('hidden');
        rejectCommandBtn.classList.remove('hidden');
        
        currentItems.forEach((data, index) => {
          const productName = data.name || 'N/A';
          const qte = data.qte || 0;
          const savedValue = data.inputValue !== null ? data.inputValue : 0;
          
          const div = document.createElement('div');
          div.className = 'item command-item';
          div.innerHTML = `
            <div class="command-product-info">
              <span class="command-product-name">${productName}</span>
              <span class="command-product-qte">Max: ${qte}</span>
            </div>
            <input type="number" 
                   class="qte-input" 
                   data-product="${productName}" 
                   data-max="${qte}"
                   min="0" 
                   max="${qte}" 
                   value="${savedValue}"
                   placeholder="Qté">
          `;
          
          // Add input event listener to save changes in real-time
          const input = div.querySelector('.qte-input');
          input.addEventListener('input', function() {
            const productName = this.dataset.product;
            const quantity = parseInt(this.value) || 0;
            const productIndex = allProducts.findIndex(p => p.name === productName);
            if (productIndex !== -1) {
              // Mark as modified even if value is 0
              allProducts[productIndex].inputValue = quantity;
              allProducts[productIndex].modified = true;
            }
          });
          
          if (index < halfLength) left.appendChild(div);
          else right.appendChild(div);
        });
        
      } else if (state === 'accept') {
        ignoreCommandBtn.classList.remove('hidden');
        
        currentItems.forEach((data, index) => {
          const productName = data.name || 'N/A';
          const dqte = data.dqte || 0;
          
          const div = document.createElement('div');
          div.className = 'item command-item';
          div.innerHTML = `
            <span class="command-product-name">${productName}</span>
            <span class="command-delivered-qte">${dqte}</span>
          `;
          
          if (index < halfLength) left.appendChild(div);
          else right.appendChild(div);
        });
        
      } else if (state === 'rejected') {
        ignoreCommandBtn.classList.remove('hidden');
        
        currentItems.forEach((data, index) => {
          const productName = data.name || 'N/A';
          
          const div = document.createElement('div');
          div.className = 'item command-item';
          div.innerHTML = `
            <span class="command-product-name">${productName}</span>
            <span class="command-rejected-qte">0</span>
          `;
          
          if (index < halfLength) left.appendChild(div);
          else right.appendChild(div);
        });
      }
    }
    
    // Remove old event listeners by cloning buttons
    const newPrevBtn = prevBtn.cloneNode(true);
    const newNextBtn = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    
    // Add new event listeners
    const actualPrevBtn = document.getElementById('prevCommandPage');
    const actualNextBtn = document.getElementById('nextCommandPage');
    
    actualPrevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderCommandPage();
      }
    });
    
    actualNextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(allProducts.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        renderCommandPage();
      }
    });
    
    renderCommandPage();
    showPage(commandDetailsPage);
    
  } catch (err) {
    console.error('Error loading command details:', err);
    alertError('Failed to load command details');
  }
}

// =========================
// Load Pharma Command Details
// =========================
async function loadPharmaCommandDetails(commandId, state) {
  currentCommandId = commandId;
  currentCommandState = state;
  
  const left = document.getElementById('leftCommandItems');
  const right = document.getElementById('rightCommandItems');
  const title = document.getElementById('command-title');
  const pageCounter = document.getElementById('commandPageCounter');
  const prevBtn = document.getElementById('prevCommandPage');
  const nextBtn = document.getElementById('nextCommandPage');
  
  let currentPage = 1;
  const itemsPerPage = 20;
  let allProducts = [];
  
  left.innerHTML = '<p class="empty-message">Loading...</p>';
  right.innerHTML = '';
  
  saveCommandBtn.classList.add('hidden');
  rejectCommandBtn.classList.add('hidden');
  ignoreCommandBtn.classList.add('hidden');
  
  try {
    const productsSnapshot = await db.collection('commands')
      .doc(commandId)
      .collection('product')
      .where('dqte', '!=', 0)
      .get();
    
    if (productsSnapshot.empty) {
      left.innerHTML = '<p class="empty-message">No products in this command 📦</p>';
      right.innerHTML = '';
      pageCounter.textContent = '0 / 0';
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      showPage(commandDetailsPage);
      return;
    }
    
    title.textContent = `Command : ${commandId}`;
    
    productsSnapshot.forEach(doc => {
      allProducts.push(doc.data());
    });
    
    function renderPharmaCommandPage() {
      ignoretext = "pharmastate";
      left.innerHTML = '';
      right.innerHTML = '';
      
      const totalPages = Math.ceil(allProducts.length / itemsPerPage);
      pageCounter.textContent = `${currentPage} / ${totalPages || 1}`;
      
      prevBtn.disabled = currentPage === 1;
      nextBtn.disabled = currentPage === totalPages || totalPages === 0;
      
      const start = (currentPage - 1) * itemsPerPage;
      const currentItems = allProducts.slice(start, start + itemsPerPage);
      const halfLength = Math.ceil(currentItems.length / 2);
      
      currentItems.forEach((data, index) => {
        const productName = data.name || 'N/A';
        const qte = data.qte || 0;
        const dqte = data.dqte || 0;
        
        const div = document.createElement('div');
        div.className = 'item command-item';
        
        if (state === 'demand') {
          div.innerHTML = `
            <span class="command-product-name">${productName}</span>
            <span class="command-product-qte">${qte}</span>
          `;
        } else if (state === 'accept') {
          ignoreCommandBtn.classList.remove('hidden');
          div.innerHTML = `
            <span class="command-product-name">${productName}</span>
            <span class="command-delivered-qte">${dqte}</span>
          `;
        } else if (state === 'rejected') {
          ignoreCommandBtn.classList.remove('hidden');
          div.innerHTML = `
            <span class="command-product-name">${productName}</span>
            <span class="command-rejected-qte">Rejected</span>
          `;
        }
        
        if (index < halfLength) left.appendChild(div);
        else right.appendChild(div);
      });
    }
    
    const newPrevBtn = prevBtn.cloneNode(true);
    const newNextBtn = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    
    const actualPrevBtn = document.getElementById('prevCommandPage');
    const actualNextBtn = document.getElementById('nextCommandPage');
    
    actualPrevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderPharmaCommandPage();
      }
    });
    
    actualNextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(allProducts.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        renderPharmaCommandPage();
      }
    });
    
    renderPharmaCommandPage();
    showPage(commandDetailsPage);
    
  } catch (err) {
    console.error('Error loading pharma command details:', err);
    alertError('Failed to load command details');
  }
}

// =========================
// Save Command (Accept)
// =========================
async function saveCommand() {
  debounceClick('saveCommand', async () => {
    try {
      const inputs = document.querySelectorAll('.qte-input');
      inputs.forEach(input => {
        const productName = input.dataset.product;
        const quantity = parseInt(input.value) || 0;
        const productIndex = allProducts.findIndex(p => p.name === productName);
        if (productIndex !== -1) {
          allProducts[productIndex].inputValue = quantity;
          allProducts[productIndex].modified = true;
        }
      });
      
      
      let hasError = false;
      let hasAtLeastOneProduct = false;
      
      allProducts.forEach(product => {
        if (product.modified) {
          const value = product.inputValue;
          const max = product.qte || 0;
          
          if (value < 0 || value > max) {
            hasError = true;
          }
          
          if (value > 0) {
            hasAtLeastOneProduct = true;
          }
        }
      });
      
      if (hasError) {
        alertError('Veuillez vérifier les quantités saisies (some values exceed maximum)');
        return;
      }
      
      // NEW: Check if at least one product has quantity > 0
      if (!hasAtLeastOneProduct) {
        alertError('Veuillez entrer au moins une quantité supérieure à 0');
        return;
      }
      
      const confirmSave = confirm('Êtes-vous sûr de vouloir accepter cette commande?');
      if (!confirmSave) return;
      
      saveCommandBtn.disabled = true;
      saveCommandBtn.textContent = 'Enregistrement...';
      
      const updates = [];
      
      // Save ONLY modified products
      allProducts.forEach(product => {
        // Only update products that have been modified
        if (product.modified) {
          const dqte = product.inputValue;
          
          const ref = db.collection('commands')
            .doc(currentCommandId)
            .collection('product')
            .doc(product.name);
          
          updates.push(ref.update({ dqte }));
        }
      });
      
      updates.push(
        db.collection('commands').doc(currentCommandId).update({ state: 'accept' })
      );
      
      await Promise.all(updates);
      
      alertSuccess('Commande acceptée avec succès!');
      saveCommandBtn.disabled = false;
      saveCommandBtn.textContent = 'Enregistrer';
      
      loadCommands(currentUser);
      
    } catch (err) {
      console.error('Error saving command:', err);
      alertError('Erreur lors de l\'enregistrement');
      saveCommandBtn.disabled = false;
      saveCommandBtn.textContent = 'Enregistrer';
    }
  });
}

// =========================
// Reject Command
// =========================
async function rejectCommand() {
  debounceClick('rejectCommand', async () => {
    try {
      const confirmReject = confirm('Êtes-vous sûr de vouloir rejeter cette commande?');
      if (!confirmReject) return;
      
      rejectCommandBtn.disabled = true;
      rejectCommandBtn.textContent = 'Rejet...';
      
      await db.collection('commands').doc(currentCommandId).update({ state: 'rejected' });
      
      alertSuccess('Commande rejetée');
      rejectCommandBtn.disabled = false;
      rejectCommandBtn.textContent = 'Rejeter';
      
      loadCommands(currentUser);
      
    } catch (err) {
      console.error('Error rejecting command:', err);
      alertError('Erreur lors du rejet');
      rejectCommandBtn.disabled = false;
      rejectCommandBtn.textContent = 'Rejeter';
    }
  });
}

// =========================
// Ignore Command
// =========================
async function ignoreCommand() {
  debounceClick('ignoreCommand', async () => {
    try {
      const confirmIgnore = confirm('Êtes-vous sûr de vouloir ignorer cette commande?');
      if (!confirmIgnore) return;
      
      ignoreCommandBtn.disabled = true;
      ignoreCommandBtn.textContent = 'Ignoration...';
      
      await db.collection('commands').doc(currentCommandId).update({ [ignoretext]: false });
      
      alertSuccess('Commande ignorée');
      ignoreCommandBtn.disabled = false;
      ignoreCommandBtn.textContent = 'Ignorer Command';
      
      loadCommands(currentUser);
      
    } catch (err) {
      console.error('Error ignoring command:', err);
      alertError('Erreur lors de l\'ignoration');
      ignoreCommandBtn.disabled = false;
      ignoreCommandBtn.textContent = 'Ignorer Command';
    }
  });
}

// =========================
// Pharma Companies List
// =========================
async function loadPharmaCompanies() {
  const container = document.getElementById('companiesContainer');
  container.innerHTML = '<p class="empty-message">Loading companies...</p>';

  try {
    const snapshot = await db.collection('users')
      .where('type', '==', 'company')
      .where('block', '==', false)
      .where('active', '==', true)
      .get();

    if (snapshot.empty) {
      container.innerHTML = '<p class="empty-message">No active companies found 🏢</p>';
      showPage(pharmaCompaniesPage);
      return;
    }

    container.innerHTML = '';
    const serverTime = await getServerTime();

    snapshot.forEach(doc => {
      const companyData = doc.data();
      const companyName = doc.id;
      const expireAt = companyData.expireAt ? companyData.expireAt.toDate() : null;
      
      if (expireAt && serverTime > expireAt) {
        return;
      }

      const card = document.createElement('div');
      card.className = 'command-card';
      card.innerHTML = `
        <h3>${companyName}</h3>
        <div class="pharma-name">${companyData.prodtime ? companyData.prodtime.toDate().toLocaleDateString() : 'N/A'}</div>
        <div class="click-hint">Click to create command</div>
      `;

      card.addEventListener('click', () => {
        createNewCommand(companyName);
      });

      container.appendChild(card);
    });

    if (container.children.length === 0) {
      container.innerHTML = '<p class="empty-message">No active companies available 🔭</p>';
    }

    showPage(pharmaCompaniesPage);

  } catch (err) {
    console.error('Error loading companies:', err);
    alertError('Failed to load companies');
    container.innerHTML = '<p class="empty-message">Error loading companies ❌</p>';
  }
}

// =========================
// Create New Command (COMPLETE FIXED VERSION)
// =========================
async function createNewCommand(companyName) {
  const left = document.getElementById('leftCommandProducts');
  const right = document.getElementById('rightCommandProducts');
  const title = document.getElementById('create-command-title');
  const pageCounter = document.getElementById('createCommandPageCounter');
  const prevBtn = document.getElementById('prevCreateCommandPage');
  const nextBtn = document.getElementById('nextCreateCommandPage');
  
  let currentPage = 1;
  const itemsPerPage = 20;
  allProductsForCommand = []; // Reset global array
  
  left.innerHTML = '<p class="empty-message">Loading products...</p>';
  right.innerHTML = '';
  
  try {
    const productsSnapshot = await db.collection('users')
      .doc(companyName)
      .collection('products')
      .where('exist', '==', true)
      .get();

    if (productsSnapshot.empty) {
      left.innerHTML = '<p class="empty-message">No active products available 📦</p>';
      right.innerHTML = '';
      pageCounter.textContent = '0 / 0';
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      showPage(createCommandPage);
      return;
    }
    
    title.textContent = `${companyName}`;
    
    productsSnapshot.forEach(doc => {
      const productData = doc.data();
      allProductsForCommand.push({
        name: productData.name,
        quantity: 0 // Initialize quantity for each product
      });
    });
    
    function saveCurrentPageInputs() {
      // Save all input values before changing page
      const inputs = document.querySelectorAll('#create-command-page .qte-input');
      inputs.forEach(input => {
        const productName = input.dataset.product;
        const quantity = parseInt(input.value) || 0;
        const productIndex = allProductsForCommand.findIndex(p => p.name === productName);
        if (productIndex !== -1) {
          allProductsForCommand[productIndex].quantity = quantity;
        }
      });
    }
    
    function renderCreateCommandPage() {
      // Save current page inputs before rendering
      saveCurrentPageInputs();
      
      left.innerHTML = '';
      right.innerHTML = '';
      
      const totalPages = Math.ceil(allProductsForCommand.length / itemsPerPage);
      pageCounter.textContent = `${currentPage} / ${totalPages || 1}`;
      
      // Update button states - use fresh references
      const currentPrevBtn = document.getElementById('prevCreateCommandPage');
      const currentNextBtn = document.getElementById('nextCreateCommandPage');
      
      if (currentPrevBtn) currentPrevBtn.disabled = currentPage === 1;
      if (currentNextBtn) currentNextBtn.disabled = currentPage === totalPages || totalPages === 0;
      
      const start = (currentPage - 1) * itemsPerPage;
      const currentItems = allProductsForCommand.slice(start, start + itemsPerPage);
      const halfLength = Math.ceil(currentItems.length / 2);
      
      currentItems.forEach((product, index) => {
        const productName = product.name || 'N/A';
        const savedQuantity = product.quantity || 0;
        
        const div = document.createElement('div');
        div.className = 'item command-item';
        div.innerHTML = `
          <div class="command-product-info">
            <span class="command-product-name">${productName}</span>
          </div>
          <input type="number" 
                 class="qte-input" 
                 data-product="${productName}"
                 min="0" 
                 value="${savedQuantity}"
                 placeholder="Quantity"
                 style="width: 100px;">
        `;
        
        // Add input event listener to save changes in real-time
        const input = div.querySelector('.qte-input');
        input.addEventListener('input', function() {
          const productName = this.dataset.product;
          const quantity = parseInt(this.value) || 0;
          const productIndex = allProductsForCommand.findIndex(p => p.name === productName);
          if (productIndex !== -1) {
            allProductsForCommand[productIndex].quantity = quantity;
          }
        });
        
        if (index < halfLength) left.appendChild(div);
        else right.appendChild(div);
      });
    }
    
    // Remove old event listeners by cloning and replacing
    const newPrevBtn = prevBtn.cloneNode(true);
    const newNextBtn = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    
    // Add new event listeners using fresh references
    const finalPrevBtn = document.getElementById('prevCreateCommandPage');
    const finalNextBtn = document.getElementById('nextCreateCommandPage');
    
    finalPrevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderCreateCommandPage();
      }
    });
    
    finalNextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(allProductsForCommand.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        renderCreateCommandPage();
      }
    });
    
    // Initial render
    renderCreateCommandPage();
    showPage(createCommandPage);
    
    currentCreatingCompany = companyName;
    
  } catch (err) {
    console.error('Error loading products for command:', err);
    alertError('Failed to load products');
  }
}

// =========================
// Save New Command (FIXED VERSION)
// =========================
async function saveNewCommand() {
  debounceClick('saveNewCommand', async () => {
    try {
      // Save current page inputs before processing
      const inputs = document.querySelectorAll('#create-command-page .qte-input');
      inputs.forEach(input => {
        const productName = input.dataset.product;
        const quantity = parseInt(input.value) || 0;
        const productIndex = allProductsForCommand.findIndex(p => p.name === productName);
        if (productIndex !== -1) {
          allProductsForCommand[productIndex].quantity = quantity;
        }
      });
      
      let hasProducts = false;
      let hasInvalidValues = false;
      const commandProducts = [];
      
      // Use allProductsForCommand array which contains all pages
      allProductsForCommand.forEach(product => {
        const quantity = product.quantity || 0;
        
        // Check for negative values
        if (quantity < 0) {
          hasInvalidValues = true;
        }
        
        if (quantity > 0) {
          hasProducts = true;
          commandProducts.push({
            name: product.name,
            qte: quantity
          });
        }
      });
      
      if (hasInvalidValues) {
        alertError('Please check quantities - negative values are not allowed');
        return;
      }
      
      if (!hasProducts) {
        alertError('Please add at least one product with quantity > 0');
        return;
      }
      
      // Show confirmation with summary
      const productSummary = commandProducts.map(p => `${p.name}: ${p.qte}`).join('\n');
      const confirmSave = confirm(`Create this command with the following quantities?`);
      if (!confirmSave) return;
      
      const saveBtn = document.getElementById('save-new-command');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Creating...';
      
      const commandId = `CMD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await db.collection('commands').doc(commandId).set({
        company: currentCreatingCompany,
        pharma: names,
        state: 'demand',
        companystate: true,
        pharmastate: true,
        type: "Pharma",
        created: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      const productPromises = commandProducts.map(product => {
        return db.collection('commands')
          .doc(commandId)
          .collection('product')
          .doc(product.name)
          .set({
            name: product.name,
            qte: product.qte,
            dqte: -1
          });
      });
      
      await Promise.all(productPromises);
      
      alertSuccess('Command created successfully!');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Command';
      
      // Reset the array after successful save
      allProductsForCommand = [];
      
      showPage(pharmaOptions);
      
    } catch (err) {
      console.error('Error creating command:', err);
      alertError('Failed to create command');
      const saveBtn = document.getElementById('save-new-command');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Command';
    }
  });
}

// =========================
// Load Pharma Products
// =========================
async function loadPharmaProducts(userName) {
  const left = document.getElementById("leftPharmaItems");
  const right = document.getElementById("rightPharmaItems");
  const pageCounter = document.getElementById("pharmaPageCounter");
  const prevBtn = document.getElementById("prevPharmaPage");
  const nextBtn = document.getElementById("nextPharmaPage");
  const saveBtn = document.getElementById("save-pharma-products");
  const finalBtn = document.getElementById("final-pharma-products");
  const datesInput = document.getElementById("pharma-dates");
  const addProductBtn = document.getElementById("add-pharma-product");

  await loadActiveState(userName);
  
  let currentPage = 1;
  const itemsPerPage = 20;
  allPharmaProducts = [];
  let showOnlyActive = false;

  async function fetchPharmaItems() {
    await loadActiveState(userName);
    left.innerHTML = "";
    right.innerHTML = "";

    try {
      const snapshot1 = await db.collection("users").doc(userName).get();
      const prodtime = snapshot1.data().prodtime;

      if (prodtime) {
        const date = prodtime.toDate();
        const formatted = date.toISOString().split("T")[0];
        datesInput.value = formatted;
      }

      const snapshot = await db.collection("users").doc(userName)
        .collection("products")
        .get();

      if (snapshot.empty) {
        left.innerHTML = `<p class="empty-message">No pharma products yet 📦</p>`;
        right.innerHTML = "";
        pageCounter.textContent = "0 / 0";
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
      }

      allPharmaProducts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          name: data.name,
          qte: data.qte || 0,
          exist: data.exist !== undefined ? data.exist : true,
          modified: false
        };
      });
      renderPharmaPage();
    } catch (error) {
      console.error("Error fetching pharma items:", error);
      alertError("Failed to load pharma products");
    }
  }

  function saveCurrentPharmaPageInputs() {
    const inputs = document.querySelectorAll('#pharma-products .qte-input');
    inputs.forEach(input => {
      const productName = input.dataset.name;
      const productIndex = allPharmaProducts.findIndex(item => item.name === productName);
      if (productIndex !== -1) {
        allPharmaProducts[productIndex].qte = parseInt(input.value) || 0;
        allPharmaProducts[productIndex].modified = true;
      }
    });
  }

  function renderPharmaPage() {
    saveCurrentPharmaPageInputs();
    
    left.innerHTML = "";
    right.innerHTML = "";

    // Hide add button if save button is showing
    if (!saveBtn.classList.contains('hidden')) {
      addProductBtn.style.display = 'none';
    } else {
      addProductBtn.style.display = 'block';
    }

    const visibleItems = showOnlyActive
      ? allPharmaProducts.filter(item => item.exist && item.qte > 0)
      : allPharmaProducts;

    const totalPages = Math.ceil(visibleItems.length / itemsPerPage);
    pageCounter.textContent = `${currentPage} / ${totalPages || 1}`;

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;

    const start = (currentPage - 1) * itemsPerPage;
    const currentItems = visibleItems.slice(start, start + itemsPerPage);

    currentItems.forEach((itemObj, index) => {
      const div = document.createElement("div");
      div.className = "item";
      
      const span = document.createElement('span');
      span.textContent = itemObj.name;
      
      const qteInput = document.createElement('input');
      qteInput.type = 'number';
      qteInput.className = 'qte-input';
      qteInput.dataset.name = itemObj.name;
      qteInput.value = itemObj.qte;
      qteInput.min = 0;
      qteInput.style.width = '100px';
      qteInput.style.marginLeft = '10px';
      
      qteInput.addEventListener('input', function() {
        const productName = this.dataset.name;
        const productIndex = allPharmaProducts.findIndex(item => item.name === productName);
        if (productIndex !== -1) {
          allPharmaProducts[productIndex].qte = parseInt(this.value) || 0;
          allPharmaProducts[productIndex].modified = true;
          saveBtn.classList.remove('hidden');
          finalBtn.classList.add('hidden');
          // Hide add button when save is showing
          addProductBtn.style.display = 'none';
        }
      });

      div.appendChild(span);
      div.appendChild(qteInput);

      if (index < 10) left.appendChild(div);
      else right.appendChild(div);
    });

    if (visibleItems.length === 0) {
      left.innerHTML = `<p class="empty-message">No active pharma products left 🧹</p>`;
      right.innerHTML = "";
    }
  }

  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderPharmaPage();
    }
  };

  nextBtn.onclick = () => {
    const totalPages = Math.ceil(
      (showOnlyActive ? allPharmaProducts.filter(i => i.exist && i.qte > 0).length : allPharmaProducts.length) / itemsPerPage
    );
    if (currentPage < totalPages) {
      currentPage++;
      renderPharmaPage();
    }
  };

  addProductBtn.onclick = async () => {
    debounceClick('addPharmaProduct', async () => {
      const newName = prompt("Enter new pharma product name:");
      if (!newName) return;

      try {
        const ref = db.collection("users")
          .doc(userName)
          .collection("products")
          .doc(newName);

        await ref.set({
          name: newName,
          qte: 0,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        alertSuccess("Pharma product added ✅");
        fetchPharmaItems();
      } catch (error) {
        console.error("Error adding pharma product:", error);
        alertError("Failed to add pharma product");
      }
    });
  };

  activeToggleBtn1.addEventListener('click', toggleActiveState1);
  
  saveBtn.onclick = async () => {
    debounceClick('savePharmaProducts', async () => {
      try {
        if(datesInput.value == ""){
          alertError("Please enter the date");
          return;
        }

        const confirmSave = confirm("Are you sure you want to save changes?");
        if (!confirmSave) return;

        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";

        // Check if at least one product has quantity > 0
        const hasActiveProducts = allPharmaProducts.some(item => item.qte > 0);
        
        const updates = [];
        const userRef = db.collection('users').doc(names);

        await userRef.update({
          prodtime: new Date(datesInput.value),
        });
        
        // Update active state based on products
        if(hasActiveProducts == false){
          await userRef.update({
          active: hasActiveProducts
        });

        }
        

        // Save only items with quantity > 0 or modified items
        allPharmaProducts.forEach(item => {
          if (item.modified) {
            const ref = db.collection("users")
              .doc(userName)
              .collection("products")
              .doc(item.name);
            updates.push(ref.update({ 
              qte: item.qte,
            }));
          }
        });

        if (updates.length > 0) {
          await Promise.all(updates);
        }

        // Update current active state
        currentActiveState = hasActiveProducts;
        updateActiveButton();

        alertSuccess("✅ Changes saved successfully!");
        saveBtn.disabled = false;
        saveBtn.textContent = "Save";
        saveBtn.classList.add('hidden');
        finalBtn.classList.remove('hidden');
        // Show add button again after save
        addProductBtn.style.display = 'block';
        fetchPharmaItems();
      } catch (error) {
        console.error("Error saving:", error);
        alertError("❌ Failed to save changes.");
        saveBtn.disabled = false;
        saveBtn.textContent = "Save";
        // Show add button again on error
        addProductBtn.style.display = 'block';
      }
    });
  };

  finalBtn.onclick = () => {
    showOnlyActive = !showOnlyActive;
    currentPage = 1;
    finalBtn.textContent = showOnlyActive ? "Show All" : "Show Active";
    renderPharmaPage();
  };

  fetchPharmaItems();
}

// =========================
// Load Company Pharma List
// =========================
async function loadCompanyPharmaList() {
  const container = document.getElementById('pharmaListContainer');
  container.innerHTML = '<p class="empty-message">Loading pharma list...</p>';

  try {
    const snapshot = await db.collection('users')
      .where('type', '==', 'Pharma')
      .where('block', '==', false)
      .where('active', '==', true)
      .get();

    if (snapshot.empty) {
      container.innerHTML = '<p class="empty-message">No active pharma found 🏢</p>';
      showPage(companyPharmaList);
      return;
    }

    container.innerHTML = '';

    snapshot.forEach(doc => {
      const pharmaData = doc.data();
      const pharmaName = doc.id;
      const prodtime = pharmaData.prodtime ? pharmaData.prodtime.toDate().toLocaleDateString() : 'N/A';

      const card = document.createElement('div');
      card.className = 'command-card';
      card.innerHTML = `
        <h3>${pharmaName}</h3>
        <div class="pharma-name">${prodtime}</div>
        <div class="click-hint">Click to create command</div>
      `;

      card.addEventListener('click', () => {
        createNewPharmaCommand(pharmaName);
      });

      container.appendChild(card);
    });

    if (container.children.length === 0) {
      container.innerHTML = '<p class="empty-message">No active pharma available 🔭</p>';
    }

    showPage(companyPharmaList);

  } catch (err) {
    console.error('Error loading pharma list:', err);
    alertError('Failed to load pharma list');
    container.innerHTML = '<p class="empty-message">Error loading pharma list ❌</p>';
  }
}

// =========================
// Create New Pharma Command
// =========================
async function createNewPharmaCommand(pharmaName) {
  cleanupListeners(); // Clean up previous listeners
  
  const left = document.getElementById('leftPharmaCommandProducts');
  const right = document.getElementById('rightPharmaCommandProducts');
  const title = document.getElementById('create-pharma-command-title');
  const pageCounter = document.getElementById('createPharmaCommandPageCounter');
  const prevBtn = document.getElementById('prevCreatePharmaCommandPage');
  const nextBtn = document.getElementById('nextCreatePharmaCommandPage');
  
  let currentPage = 1;
  const itemsPerPage = 20;
  allPharmaProductsForCommand = [];
  
  left.innerHTML = '<p class="empty-message">Loading products...</p>';
  right.innerHTML = '';
  
  try {
    const productsSnapshot = await db.collection('users')
      .doc(pharmaName)
      .collection('products')
      .where('qte', '>', 0)
      .get();

    if (productsSnapshot.empty) {
      left.innerHTML = '<p class="empty-message">No active products available 📦</p>';
      right.innerHTML = '';
      pageCounter.textContent = '0 / 0';
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      showPage(createPharmaCommandPage);
      return;
    }
    
    title.textContent = `Create Command for ${pharmaName}`;
    
    productsSnapshot.forEach(doc => {
      const productData = doc.data();
      allPharmaProductsForCommand.push({
        name: productData.name,
        qte: productData.qte || 0, // Store the max quantity
        quantity: 0 // Initialize input quantity
      });
    });
    
    // Setup real-time listeners
    pharmaProductsListener = setupPharmaProductsListener(pharmaName);
    userActiveStateListener = setupUserActiveStateListener(names);
    
    function saveCurrentPharmaCommandInputs() {
      const inputs = document.querySelectorAll('#create-pharma-command-page .qte-input');
      inputs.forEach(input => {
        const productName = input.dataset.product;
        const quantity = parseInt(input.value) || 0;
        const productIndex = allPharmaProductsForCommand.findIndex(p => p.name === productName);
        if (productIndex !== -1) {
          allPharmaProductsForCommand[productIndex].quantity = quantity;
        }
      });
    }
    
    function renderCreatePharmaCommandPage() {
  saveCurrentPharmaCommandInputs();
  
  left.innerHTML = '';
  right.innerHTML = '';
  
  const totalPages = Math.ceil(allPharmaProductsForCommand.length / itemsPerPage);
  pageCounter.textContent = `${currentPage} / ${totalPages || 1}`;
  
  const currentPrevBtn = document.getElementById('prevCreatePharmaCommandPage');
  const currentNextBtn = document.getElementById('nextCreatePharmaCommandPage');
  
  if (currentPrevBtn) currentPrevBtn.disabled = currentPage === 1;
  if (currentNextBtn) currentNextBtn.disabled = currentPage === totalPages || totalPages === 0;
  
  const start = (currentPage - 1) * itemsPerPage;
  const currentItems = allPharmaProductsForCommand.slice(start, start + itemsPerPage);
  const halfLength = Math.ceil(currentItems.length / 2);
  
  currentItems.forEach((product, index) => {
    const productName = product.name || 'N/A';
    const maxQte = product.qte || 0; // Max quantity from database
    const savedQuantity = product.quantity || 0;
    
    const div = document.createElement('div');
    div.className = 'item command-item';
    div.innerHTML = `
      <div class="command-product-info">
        <span class="command-product-name">${productName}</span>
        <span class="command-product-max">Max: ${maxQte}</span>
      </div>
      <input type="number" 
             class="qte-input" 
             data-product="${productName}"
             min="0" 
             max="${maxQte}"
             value="${savedQuantity}"
             placeholder="Quantity"
             style="width: 100px;">
    `;
    
    const input = div.querySelector('.qte-input');
    input.addEventListener('input', function() {
      const productName = this.dataset.product;
      const quantity = parseInt(this.value) || 0;
      const max = parseInt(this.max) || 0;
      const productIndex = allPharmaProductsForCommand.findIndex(p => p.name === productName);
      
      if (productIndex !== -1) {
        // Validate against max
        if (quantity > max) {
          this.value = max;
          allPharmaProductsForCommand[productIndex].quantity = max;
        } else {
          allPharmaProductsForCommand[productIndex].quantity = quantity;
        }
      }
    });
    
    if (index < halfLength) left.appendChild(div);
    else right.appendChild(div);
  });
}
    
    const newPrevBtn = prevBtn.cloneNode(true);
    const newNextBtn = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    
    const finalPrevBtn = document.getElementById('prevCreatePharmaCommandPage');
    const finalNextBtn = document.getElementById('nextCreatePharmaCommandPage');
    
    finalPrevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderCreatePharmaCommandPage();
      }
    });
    
    finalNextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(allPharmaProductsForCommand.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        renderCreatePharmaCommandPage();
      }
    });
    
    renderCreatePharmaCommandPage();
    showPage(createPharmaCommandPage);
    
    currentCreatingPharma = pharmaName;
    
  } catch (err) {
    console.error('Error loading products for pharma command:', err);
    alertError('Failed to load products');
  }
}

// =========================
// Save New Pharma Command (UPDATED with Quantity Deduction)
// =========================
async function saveNewPharmaCommand() {
  debounceClick('saveNewPharmaCommand', async () => {
    try {
      // Save current page inputs before processing
      const inputs = document.querySelectorAll('#create-pharma-command-page .qte-input');
      inputs.forEach(input => {
        const productName = input.dataset.product;
        const quantity = parseInt(input.value) || 0;
        const productIndex = allPharmaProductsForCommand.findIndex(p => p.name === productName);
        if (productIndex !== -1) {
          allPharmaProductsForCommand[productIndex].quantity = quantity;
        }
      });
      
      let hasProducts = false;
      let hasInvalidValues = false;
      const commandProducts = [];
      
      // Validate ALL products across all pages
      allPharmaProductsForCommand.forEach(product => {
        const quantity = product.quantity || 0;
        const maxQte = product.qte || 0;
        
        // Check for invalid values
        if (quantity < 0 || quantity > maxQte) {
          hasInvalidValues = true;
          console.error(`Invalid quantity for ${product.name}: ${quantity} (max: ${maxQte})`);
        }
        
        if (quantity > 0) {
          hasProducts = true;
          commandProducts.push({
            name: product.name,
            qte: quantity,
            originalQte: product.qte // Store original quantity for deduction
          });
        }
      });
      
      if (hasInvalidValues) {
        alertError('Please check quantities - some values exceed maximum limits');
        return;
      }
      
      if (!hasProducts) {
        alertError('Please add at least one product with quantity > 0');
        return;
      }
      
      // Show confirmation with summary
      const productSummary = commandProducts.map(p => `${p.name}: ${p.qte}`).join('\n');
      const confirmSave = confirm(`Create this command with the following quantities?`);
      if (!confirmSave) return;

      allPharmaProductsForCommand.forEach(product => {
        const quantity = product.quantity || 0;
        const maxQte = product.qte || 0;
        
        // Check for invalid values
        if (quantity < 0 || quantity > maxQte) {
          hasInvalidValues = true;
          console.error(`Invalid quantity for ${product.name}: ${quantity} (max: ${maxQte})`);
        }
        
        if (quantity > 0) {
          hasProducts = true;
          commandProducts.push({
            name: product.name,
            qte: quantity,
            originalQte: product.qte // Store original quantity for deduction
          });
        }
      });
      
      if (hasInvalidValues) {
        alertError('Please check quantities - some values exceed maximum limits');
        return;
      }
      
      const saveBtn = document.getElementById('save-new-pharma-command');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Creating...';
      
      const commandId = `CMD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create the command
      await db.collection('commands').doc(commandId).set({
        company: names, // Current company
        pharma: currentCreatingPharma,
        state: 'accept',
        companystate: true,
        pharmastate: true,
        type: "company",
        created: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      const productPromises = commandProducts.map(product => {
        return db.collection('commands')
          .doc(commandId)
          .collection('product')
          .doc(product.name)
          .set({
            name: product.name,
            qte: product.qte,
            dqte: product.qte,
          });
      });
      
      // Deduct quantities from pharma's products
      const deductionPromises = commandProducts.map(product => {
        const newQuantity = Math.max(0, product.originalQte - product.qte);
        
        return db.collection('users')
          .doc(currentCreatingPharma)
          .collection('products')
          .doc(product.name)
          .update({
            qte: newQuantity
          });
      });
      
      await Promise.all([...productPromises, ...deductionPromises]);
      
      alertSuccess('Pharma command created successfully! Quantities deducted.');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Create Command';
      
      allPharmaProductsForCommand = [];
      cleanupListeners();
      showPage(companyOptions);
      
    } catch (err) {
      console.error('Error creating pharma command:', err);
      alertError('Failed to create pharma command');
      const saveBtn = document.getElementById('save-new-pharma-command');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Create Command';
      cleanupListeners();
    }
  });
}

// =========================
// Unified Back Button Handler for Command Details
// =========================
async function handleBackFromCommandDetails() {
  if (currentUser) {
    const userDoc = await db.collection('users').doc(currentUser).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData.type === 'company') {
        loadCommands(currentUser);
      } else if (userData.type === 'Pharma') {
        loadCommands(currentUser);
      }
    }
  }
}

// =========================
// Event Listeners
// =========================
backCommands.addEventListener('click', async () => {
  if (currentUser) {
    const userDoc = await db.collection('users').doc(currentUser).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData.type === 'company') {
        showPage(companyOptions);
      } else if (userData.type === 'Pharma') {
        showPage(pharmaOptions);
      }
    }
  }
});

backToCommands.addEventListener('click', handleBackFromCommandDetails);
saveCommandBtn.addEventListener('click', saveCommand);
rejectCommandBtn.addEventListener('click', rejectCommand);
ignoreCommandBtn.addEventListener('click', ignoreCommand);
activeToggleBtn.addEventListener('click', toggleActiveState1);
loginBtn.addEventListener('click', login);
registerBtn.addEventListener('click', registerUser);
newUsersBtn.addEventListener('click', () => showPage(pageRegister));
usersBtn.addEventListener('click', loadUsers);
backManagement.addEventListener('click', () => showPage(ownerOptions));
backManagement1.addEventListener('click', () => showPage(ownerOptions));
backProduct.addEventListener('click', () => {
  if (save.classList.contains("hidden")) {
    if(storedType == "company") {
      showPage(companyOptions);
    } else {
      showPage(companyOptions);
    }
  } else {
    const confirmAdd = confirm("Are you sure you want to cancel?");
    if (!confirmAdd) return;
    save.classList.add('hidden');
    addProduct.classList.remove('hidden');
    final.classList.remove('hidden');
    showPage(companyOptions);
  }
});
product.addEventListener('click', () => {
  loadProducts(names);
  showPage(products);
});
typeSelect.addEventListener('change', () => {
  checkboxGroup.style.display = (typeSelect.value === 'Pharma') ? 'none' : 'flex';
});
dates.addEventListener('change', () => {
  final.classList.add('hidden');
  save.classList.remove('hidden');
});
commandsBtn.addEventListener('click', () => {
  if (currentUser) {
    loadCommands(currentUser);
  } else {
    alertError('No user logged in');
  }
});

// =========================
// Additional Event Listeners
// =========================
document.addEventListener('DOMContentLoaded', function() {
  const pharmaCompaniesBtn = document.getElementById('pharma-companies-btn');
  const pharmaCommandsBtn = document.getElementById('pharma-commands-btn');
  const backPharmaCompanies = document.getElementById('back-pharma-companies');
  const backCreateCommand = document.getElementById('back-create-command');
  const saveNewCommandBtn = document.getElementById('save-new-command');
  
  // Pharma Products Button
  const pharmaProductsBtn = document.getElementById('pharma-products-btn');
  if (pharmaProductsBtn) {
    pharmaProductsBtn.addEventListener('click', () => {
      if (currentUser) {
        loadPharmaProducts(currentUser);
        showPage(pharmaProducts);
      } else {
        alertError('No user logged in');
      }
    });
  }
  
  // Back button for pharma products
  const backPharmaProducts = document.getElementById('back-pharma-products');
  if (backPharmaProducts) {
    backPharmaProducts.addEventListener('click', () => {
      const saveBtn = document.getElementById("save-pharma-products");
      const finalBtn = document.getElementById("final-pharma-products");
      if (saveBtn.classList.contains("hidden")) {
        showPage(pharmaOptions);
      } else {
        const confirmAdd = confirm("Are you sure you want to cancel?");
        if (!confirmAdd) return;
        saveBtn.classList.add('hidden');
        finalBtn.classList.remove('hidden');
        showPage(pharmaOptions);
      }
    });
  }
  
  // Company Pharma Button
  const companyPharmaBtn = document.getElementById('company-pharma-btn');
  if (companyPharmaBtn) {
    companyPharmaBtn.addEventListener('click', loadCompanyPharmaList);
  }
  
  // Back button for company pharma list
  const backCompanyPharma = document.getElementById('back-company-pharma');
  if (backCompanyPharma) {
    backCompanyPharma.addEventListener('click', () => showPage(companyOptions));
  }
  
  // Back button for create pharma command
  const backCreatePharmaCommand = document.getElementById('back-create-pharma-command');
  if (backCreatePharmaCommand) {
    backCreatePharmaCommand.addEventListener('click', () => {
      cleanupListeners();
      showPage(companyPharmaList);
    });
  }
  
  // Save new pharma command button
  const saveNewPharmaCommandBtn = document.getElementById('save-new-pharma-command');
  if (saveNewPharmaCommandBtn) {
    saveNewPharmaCommandBtn.addEventListener('click', saveNewPharmaCommand);
  }
  
  if (pharmaCompaniesBtn) {
    pharmaCompaniesBtn.addEventListener('click', loadPharmaCompanies);
  }
  
  if (pharmaCommandsBtn) {
    pharmaCommandsBtn.addEventListener('click', () => {
      if (currentUser) {
        loadCommands(currentUser);
      } else {
        alertError('No user logged in');
      }
    });
  }
  
  if (backPharmaCompanies) {
    backPharmaCompanies.addEventListener('click', () => showPage(pharmaOptions));
  }
  
  if (backCreateCommand) {
    backCreateCommand.addEventListener('click', () => showPage(pharmaCompaniesPage));
  }
  
  if (saveNewCommandBtn) {
    saveNewCommandBtn.addEventListener('click', saveNewCommand);
  }
});


// =========================
// History Page Elements
// =========================
const historyPage = document.getElementById('history-page');
const historySearchInput = document.getElementById('history-search-input');
const historySearchBtn = document.getElementById('history-search-btn');
const historyResults = document.getElementById('history-results');
const backHistoryBtn = document.getElementById('back-history');

// =========================
// History Functions
// =========================
async function searchHistory() {
  debounceClick('historySearch', async () => {
    const commandId = historySearchInput.value.trim();
    
    if (!commandId) {
      alertError('Please enter a command ID');
      return;
    }

    try {
      historySearchBtn.disabled = true;
      historySearchBtn.textContent = 'Searching...';
      historyResults.innerHTML = '<p class="empty-message">Searching...</p>';

      const commandDoc = await db.collection('commands').doc(commandId).get();
      
      if (!commandDoc.exists) {
        historyResults.innerHTML = '<p class="empty-message">Command not found 🔍</p>';
        historySearchBtn.disabled = false;
        historySearchBtn.textContent = 'Search';
        return;
      }

      const commandData = commandDoc.data();
      await displayHistoryResult(commandId, commandData);

    } catch (err) {
      console.error('Error searching history:', err);
      alertError('Failed to search command');
      historyResults.innerHTML = '<p class="empty-message">Error searching command ❌</p>';
    } finally {
      historySearchBtn.disabled = false;
      historySearchBtn.textContent = 'Search';
    }
  });
}

async function displayHistoryResult(commandId, commandData) {
  try {
    const company = commandData.company || 'N/A';
    const pharma = commandData.pharma || 'N/A';
    const companystate = commandData.companystate === true ? 'Active' : 'Inactive';
    const pharmastate = commandData.pharmastate === true ? 'Active' : 'Inactive';
    const state = commandData.state || 'N/A';

    const card = document.createElement('div');
    card.className = 'carde';
    card.innerHTML = `
      <h5>${commandId}</h5>
      <p><span class="label">Enterprise:</span> ${company}</p>
      <p><span class="label">Pharmacy:</span> ${pharma}</p>
      <p><span class="label">Company State:</span> <span class="company-state status ${companystate.toLowerCase()}" data-command="${commandId}" data-field="companystate" data-current="${commandData.companystate}" style="cursor:pointer;">${companystate}</span></p>
      <p><span class="label">Pharmacy State:</span> <span class="pharma-state status ${pharmastate.toLowerCase()}" data-command="${commandId}" data-field="pharmastate" data-current="${commandData.pharmastate}" style="cursor:pointer;">${pharmastate}</span></p>
      <p><span class="label">State:</span> <span class="command-state status ${state.toLowerCase()}" data-command="${commandId}" data-current="${state}" style="cursor:${state !== 'demand' ? 'pointer' : 'default'}; opacity:${state === 'demand' ? '0.7' : '1'}">${state}</span></p>
    `;

    historyResults.innerHTML = '';
    historyResults.appendChild(card);

    // Add event listeners after a small delay to ensure DOM is ready
    setTimeout(() => {
      setupHistoryEventListeners();
    }, 100);

  } catch (err) {
    console.error('Error displaying history result:', err);
    alertError('Failed to display command details');
  }
}

function setupHistoryEventListeners() {
  // Company state toggle
  const companyStateEl = document.querySelector('.company-state');
  if (companyStateEl) {
    companyStateEl.addEventListener('click', handleCompanyStateToggle);
  }

  // Pharma state toggle
  const pharmaStateEl = document.querySelector('.pharma-state');
  if (pharmaStateEl) {
    pharmaStateEl.addEventListener('click', handlePharmaStateToggle);
  }

  // Command state toggle
  const commandStateEl = document.querySelector('.command-state');
  if (commandStateEl && commandStateEl.dataset.current !== 'demand') {
    commandStateEl.addEventListener('click', handleCommandStateToggle);
  }
}

function handleCompanyStateToggle(event) {
  const element = event.target;
  const commandId = element.dataset.command;
  const currentValue = element.dataset.current === 'true';
  const newValue = !currentValue;
  
  toggleCommandState(commandId, 'companystate', newValue, element);
}

function handlePharmaStateToggle(event) {
  const element = event.target;
  const commandId = element.dataset.command;
  const currentValue = element.dataset.current === 'true';
  const newValue = !currentValue;
  
  toggleCommandState(commandId, 'pharmastate', newValue, element);
}

function handleCommandStateToggle(event) {
  const element = event.target;
  const commandId = element.dataset.command;
  const currentState = element.dataset.current;
  
  if (currentState !== 'demand') {
    toggleCommandStateToDemand(commandId, element);
  }
}

async function toggleCommandState(commandId, field, newValue, element) {
  debounceClick(`toggle-${field}-${commandId}`, async () => {
    const currentState = element.textContent;
    const newState = newValue ? 'Active' : 'Inactive';
    
    const confirmChange = confirm(`Are you sure you want to change ${field} from "${currentState}" to "${newState}"?`);
    if (!confirmChange) return;

    try {
      element.textContent = 'Updating...';
      element.style.pointerEvents = 'none';

      await db.collection('commands').doc(commandId).update({
        [field]: newValue
      });

      // Update UI
      element.textContent = newState;
      element.className = `status ${newState.toLowerCase()}`;
      element.dataset.current = newValue;
      
      alertSuccess(`${field} updated successfully!`);

    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      alertError(`Failed to update ${field}`);
      // Revert UI on error
      element.textContent = currentState;
      element.className = `status ${currentState.toLowerCase()}`;
    } finally {
      element.style.pointerEvents = 'auto';
    }
  });
}

async function toggleCommandStateToDemand(commandId, element) {
  debounceClick(`toggle-state-${commandId}`, async () => {
    const currentState = element.dataset.current;
    
    const confirmChange = confirm(`Are you sure you want to change state from "${currentState}" to "demand"?`);
    if (!confirmChange) return;

    try {
      element.textContent = 'Updating...';
      element.style.pointerEvents = 'none';

      await db.collection('commands').doc(commandId).update({
        state: 'demand'
      });

      // Update UI
      element.textContent = 'demand';
      element.className = 'status demand';
      element.dataset.current = 'demand';
      element.style.cursor = 'default';
      element.style.opacity = '0.7';
      
      // Remove click listener
      element.removeEventListener('click', handleCommandStateToggle);
      
      alertSuccess('State updated to demand successfully!');

    } catch (err) {
      console.error('Error updating state:', err);
      alertError('Failed to update state');
      // Revert UI on error
      element.textContent = currentState;
      element.className = `status ${currentState.toLowerCase()}`;
    } finally {
      element.style.pointerEvents = 'auto';
    }
  });
}

function showHistoryPage() {
  historySearchInput.value = '';
  historyResults.innerHTML = '<p class="empty-message">Enter a command ID to search 🔍</p>';
  showPage(historyPage);
}

// =========================
// Event Listeners for History
// =========================
function initializeHistoryListeners() {
  const historyBtn = document.getElementById('history');
  
  if (historyBtn) {
    historyBtn.addEventListener('click', showHistoryPage);
  }
  
  if (historySearchBtn) {
    historySearchBtn.addEventListener('click', searchHistory);
  }
  
  if (historySearchInput) {
    historySearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchHistory();
      }
    });
  }
  
  if (backHistoryBtn) {
    backHistoryBtn.addEventListener('click', () => showPage(ownerOptions));
  }
}

// Initialize history listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeHistoryListeners();
});

// =========================
// Cleanup on page unload
// =========================
window.addEventListener('beforeunload', cleanupListeners);