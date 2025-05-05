// Data pengguna dan tugas
let currentUser = null;
let categories = [];
let tasks = [];
let currentCategoryFilter = 'all';

// Element loading
const loading = document.createElement('div');
loading.className = 'loading';
loading.innerHTML = '<div class="loading-spinner"></div>';
document.body.appendChild(loading);

// Fungsi untuk menampilkan loading
function showLoading() {
    loading.classList.add('active');
}

// Fungsi untuk menyembunyikan loading
function hideLoading() {
    loading.classList.remove('active');
}

// Fungsi untuk menampilkan error
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.add('active');
}

// Fungsi untuk menyembunyikan error
function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = '';
    errorElement.classList.remove('active');
}

// Fungsi untuk melakukan fetch API
async function fetchAPI(url, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        if (data) {
            const formData = new URLSearchParams();
            for (const key in data) {
                formData.append(key, data[key]);
            }
            options.body = formData;
        }

        const response = await fetch(url, options);
        const result = await response.json();
        
        if (result.status === 'error') {
            throw new Error(result.message);
        }
        
        return result;
    } catch (error) {
        throw error;
    }
}

// Event listener untuk tab login dan register
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        const tabName = this.dataset.tab;
        
        // Menghapus kelas active dari semua tab
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Menambahkan kelas active ke tab yang diklik
        this.classList.add('active');
        document.getElementById(tabName + 'Tab').classList.add('active');
        
        // Menghapus error
        hideError('loginError');
        hideError('registerError');
    });
});

// Fungsi untuk login
document.getElementById('loginBtn').addEventListener('click', async function() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showError('loginError', 'Silakan masukkan username dan password');
        return;
    }
    
    hideError('loginError');
    showLoading();
    
    try {
        const result = await fetchAPI('auth.php', 'POST', {
            action: 'login',
            username: username,
            password: password
        });
        
        // Menyimpan data pengguna
        currentUser = {
            id: result.data.user_id,
            username: result.data.username,
            initial: result.data.username.charAt(0).toUpperCase()
        };
        
        // Menampilkan halaman aplikasi
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('appPage').style.display = 'block';
        
        // Update UI dengan info pengguna
        document.getElementById('userAvatar').textContent = currentUser.initial;
        document.getElementById('userName').textContent = currentUser.username;
        
        // Memuat kategori dan tugas
        await loadCategories();
        await updateTaskCounts();
        await loadTasks();
        
    } catch (error) {
        showError('loginError', error.message);
    } finally {
        hideLoading();
    }
});

// Fungsi untuk register
document.getElementById('registerBtn').addEventListener('click', async function() {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!username || !password || !confirmPassword) {
        showError('registerError', 'Silakan isi semua field');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('registerError', 'Password dan konfirmasi password tidak sama');
        return;
    }
    
    hideError('registerError');
    showLoading();
    
    try {
        const result = await fetchAPI('auth.php', 'POST', {
            action: 'register',
            username: username,
            password: password
        });
        
        // Menyimpan data pengguna
        currentUser = {
            id: result.data.user_id,
            username: result.data.username,
            initial: result.data.username.charAt(0).toUpperCase()
        };
        
        // Menampilkan halaman aplikasi
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('appPage').style.display = 'block';
        
        // Update UI dengan info pengguna
        document.getElementById('userAvatar').textContent = currentUser.initial;
        document.getElementById('userName').textContent = currentUser.username;
        
        // Memuat kategori dan tugas
        await loadCategories();
        await updateTaskCounts();
        await loadTasks();
        
    } catch (error) {
        showError('registerError', error.message);
    } finally {
        hideLoading();
    }
});

// Fungsi untuk logout
document.getElementById('logoutBtn').addEventListener('click', async function() {
    // Menampilkan konfirmasi sebelum logout
    if (confirm('Apakah Anda yakin ingin keluar dari aplikasi?')) {
        showLoading();
        
        try {
            await fetchAPI('auth.php?action=logout');
            
            // Menghapus data pengguna
            currentUser = null;
            categories = [];
            tasks = [];
            
            // Menampilkan halaman login
            document.getElementById('appPage').style.display = 'none';
            document.getElementById('loginPage').style.display = 'flex';
            
            // Mereset form login
            document.getElementById('loginUsername').value = '';
            document.getElementById('loginPassword').value = '';
            document.getElementById('registerUsername').value = '';
            document.getElementById('registerPassword').value = '';
            document.getElementById('confirmPassword').value = '';
            
        } catch (error) {
            alert('Terjadi kesalahan saat logout: ' + error.message);
        } finally {
            hideLoading();
        }
    }
});

// Fungsi untuk memuat kategori
async function loadCategories() {
    try {
        const result = await fetchAPI('categories.php');
        categories = result.data;
        updateCategoryList();
        updateTaskCategoryOptions();
    } catch (error) {
        alert('Terjadi kesalahan saat memuat kategori: ' + error.message);
    }
}

// Fungsi untuk memperbarui daftar kategori
function updateCategoryList() {
    const categoryList = document.getElementById('categoryList');
    
    // Menyimpan kategori yang aktif
    const activeCategory = currentCategoryFilter;
    
    // Menghapus semua kategori kecuali "Semua"
    while (categoryList.children.length > 1) {
        categoryList.removeChild(categoryList.lastChild);
    }
    
    // Menambahkan kategori kembali
    categories.forEach(category => {
        const li = document.createElement('li');
        li.className = 'category-item';
        if (category.id.toString() === activeCategory) {
            li.classList.add('active');
        }
        li.dataset.category = category.id;
        
        const categoryName = document.createElement('span');
        categoryName.textContent = category.name.charAt(0).toUpperCase() + category.name.slice(1);
        
        const count = document.createElement('span');
        count.className = 'category-item-count';
        count.textContent = '0';
        
        const actionButtons = document.createElement('div');
        actionButtons.className = 'category-actions';
        actionButtons.style.display = 'none';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'category-action-btn';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'Hapus kategori';
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Mencegah trigger event kategori
            deleteCategory(category.id, category.name);
        });
        
        actionButtons.appendChild(deleteBtn);
        
        li.appendChild(categoryName);
        li.appendChild(count);
        li.appendChild(actionButtons);
        
        // Menampilkan tombol aksi saat hover
        li.addEventListener('mouseenter', function() {
            if (category.id.toString() !== 'all') {
                actionButtons.style.display = 'flex';
            }
        });
        
        li.addEventListener('mouseleave', function() {
            actionButtons.style.display = 'none';
        });
        
        categoryList.appendChild(li);
    });
}

// Fungsi untuk memperbarui opsi kategori di modal tambah tugas
function updateTaskCategoryOptions() {
    const taskCategory = document.getElementById('taskCategory');
    const editTaskCategory = document.getElementById('editTaskCategory');
    
    // Menghapus semua opsi
    taskCategory.innerHTML = '';
    editTaskCategory.innerHTML = '';
    
    // Menambahkan opsi kategori
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name.charAt(0).toUpperCase() + category.name.slice(1);
        taskCategory.appendChild(option.cloneNode(true));
        editTaskCategory.appendChild(option);
    });
}

// Fungsi untuk memperbarui hitungan tugas per kategori
async function updateTaskCounts() {
    try {
        const result = await fetchAPI('tasks.php?action=count_by_category');
        const counts = result.data;
        
        document.querySelectorAll('.category-item').forEach(item => {
            const categoryId = item.dataset.category;
            const countElement = item.querySelector('.category-item-count');
            
            const categoryCount = counts.find(c => 
                (categoryId === 'all' && c.category_id === 'all') || 
                (c.category_id.toString() === categoryId)
            );
            
            if (countElement && categoryCount) {
                countElement.textContent = categoryCount.task_count;
            } else if (countElement) {
                countElement.textContent = '0';
            }
        });
    } catch (error) {
        console.error('Terjadi kesalahan saat memperbarui hitungan tugas:', error.message);
    }
}

// Fungsi untuk memuat tugas
async function loadTasks() {
    showLoading();
    
    try {
        let url = 'tasks.php';
        
        if (currentCategoryFilter !== 'all') {
            url += '?category_id=' + currentCategoryFilter;
        }
        
        const search = document.getElementById('searchInput').value.trim();
        if (search) {
            url += (url.includes('?') ? '&' : '?') + 'search=' + encodeURIComponent(search);
        }
        
        const result = await fetchAPI(url);
        tasks = result.data;
        updateTaskList();
    } catch (error) {
        alert('Terjadi kesalahan saat memuat tugas: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Fungsi untuk memperbarui daftar tugas
function updateTaskList() {
    const taskList = document.getElementById('taskList');
    
    // Menghapus semua tugas
    taskList.innerHTML = '';
    
    // Jika tidak ada tugas
    if (tasks.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'Tidak ada tugas';
        taskList.appendChild(emptyMessage);
        return;
    }
    
    // Menambahkan tugas ke daftar
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.dataset.id = task.id;
        
        const taskItemHeader = document.createElement('div');
        taskItemHeader.className = 'task-item-header';
        
        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';
        
        const checkbox = document.createElement('div');
        checkbox.className = 'task-checkbox';
        if (task.completed) {
            checkbox.classList.add('checked');
        }
        checkbox.addEventListener('click', function() {
            toggleTaskCompletion(task.id, !task.completed);
        });
        
        const taskDetails = document.createElement('div');
        taskDetails.className = 'task-details';
        
        const taskTitle = document.createElement('div');
        taskTitle.className = 'task-title';
        if (task.completed) {
            taskTitle.classList.add('completed-task');
        }
        taskTitle.textContent = task.title;
        
        const taskCategory = document.createElement('div');
        taskCategory.className = 'task-category';
        taskCategory.textContent = task.category.name.charAt(0).toUpperCase() + task.category.name.slice(1);
        
        taskDetails.appendChild(taskTitle);
        taskDetails.appendChild(taskCategory);
        
        taskContent.appendChild(checkbox);
        taskContent.appendChild(taskDetails);
        
        const taskActions = document.createElement('div');
        taskActions.className = 'task-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'task-action-btn';
        editBtn.innerHTML = '✏️';
        editBtn.addEventListener('click', function() {
            openEditTaskModal(task);
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'task-action-btn';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.addEventListener('click', function() {
            deleteTask(task.id);
        });
        
        taskActions.appendChild(editBtn);
        taskActions.appendChild(deleteBtn);
        
        taskItemHeader.appendChild(taskContent);
        taskItemHeader.appendChild(taskActions);
        
        li.appendChild(taskItemHeader);
        taskList.appendChild(li);
    });
}

// Event listener untuk kategori
document.getElementById('categoryList').addEventListener('click', function(e) {
    const categoryItem = e.target.closest('.category-item');
    if (categoryItem) {
        const category = categoryItem.dataset.category;
        
        // Menghapus kelas active dari semua item kategori
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Menambahkan kelas active ke item yang diklik
        categoryItem.classList.add('active');
        
        // Memperbarui kategori saat ini
        currentCategoryFilter = category;
        
        // Memperbarui judul kategori
        const categoryName = category === 'all' ? 'Semua' : 
            categories.find(cat => cat.id.toString() === category)?.name || 'Kategori';
        document.getElementById('currentCategory').textContent = 
            categoryName.charAt(0).toUpperCase() + categoryName.slice(1) + ' Tugas';
        
        // Memperbarui daftar tugas berdasarkan kategori
        loadTasks();
    }
});

// Event listener untuk menambah kategori
document.getElementById('addCategoryBtn').addEventListener('click', function() {
    document.getElementById('categoryName').value = '';
    hideError('categoryError');
    document.getElementById('addCategoryModal').classList.add('active');
});

// Event listener untuk menutup modal kategori
document.getElementById('closeCategoryModal').addEventListener('click', function() {
    document.getElementById('addCategoryModal').classList.remove('active');
});

document.getElementById('cancelCategoryBtn').addEventListener('click', function() {
    document.getElementById('addCategoryModal').classList.remove('active');
});

// Event listener untuk menambahkan kategori baru
document.getElementById('submitCategoryBtn').addEventListener('click', async function() {
    const categoryName = document.getElementById('categoryName').value.trim().toLowerCase();
    
    if (!categoryName) {
        showError('categoryError', 'Silakan masukkan nama kategori');
        return;
    }
    
    hideError('categoryError');
    showLoading();
    
    try {
        const result = await fetchAPI('categories.php', 'POST', {
            action: 'add',
            name: categoryName
        });
        
        // Menambahkan kategori baru ke array
        categories.push({
            id: result.data.id,
            name: result.data.name
        });
        
        // Memperbarui daftar kategori
        updateCategoryList();
        
        // Memperbarui opsi kategori di modal tambah tugas
        updateTaskCategoryOptions();
        
        // Menutup modal
        document.getElementById('addCategoryModal').classList.remove('active');
        
        // Memperbarui hitungan tugas
        await updateTaskCounts();
        
    } catch (error) {
        showError('categoryError', error.message);
    } finally {
        hideLoading();
    }
});

// Event listener untuk menambah tugas
document.getElementById('addTaskBtn').addEventListener('click', function() {
    document.getElementById('taskTitle').value = '';
    hideError('taskError');
    document.getElementById('addTaskModal').classList.add('active');
});

// Event listener untuk menutup modal tugas
document.getElementById('closeTaskModal').addEventListener('click', function() {
    document.getElementById('addTaskModal').classList.remove('active');
});

document.getElementById('cancelTaskBtn').addEventListener('click', function() {
    document.getElementById('addTaskModal').classList.remove('active');
});

// Event listener untuk menambahkan tugas baru
document.getElementById('submitTaskBtn').addEventListener('click', async function() {
    const taskTitle = document.getElementById('taskTitle').value.trim();
    const taskCategoryId = document.getElementById('taskCategory').value;
    
    if (!taskTitle) {
        showError('taskError', 'Silakan masukkan judul tugas');
        return;
    }
    
    hideError('taskError');
    showLoading();
    
    try {
        await fetchAPI('tasks.php', 'POST', {
            action: 'add',
            title: taskTitle,
            category_id: taskCategoryId
        });
        
        // Mereset form dan menutup modal
        document.getElementById('taskTitle').value = '';
        document.getElementById('addTaskModal').classList.remove('active');
        
        // Memperbarui daftar tugas dan hitungan
        await updateTaskCounts();
        await loadTasks();
        
    } catch (error) {
        showError('taskError', error.message);
    } finally {
        hideLoading();
    }
});

// Event listener untuk pencarian tugas
document.getElementById('searchInput').addEventListener('input', function() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
        loadTasks();
    }, 500);
});

// Event listener untuk modal edit tugas
document.getElementById('closeEditTaskModal').addEventListener('click', function() {
    document.getElementById('editTaskModal').classList.remove('active');
});

document.getElementById('cancelEditTaskBtn').addEventListener('click', function() {
    document.getElementById('editTaskModal').classList.remove('active');
});

// Event listener untuk menyimpan tugas yang diedit
document.getElementById('submitEditTaskBtn').addEventListener('click', async function() {
    const taskId = document.getElementById('editTaskId').value;
    const taskTitle = document.getElementById('editTaskTitle').value.trim();
    const taskCategoryId = document.getElementById('editTaskCategory').value;
    
    if (!taskTitle) {
        showError('editTaskError', 'Silakan masukkan judul tugas');
        return;
    }
    
    hideError('editTaskError');
    showLoading();
    
    try {
        await fetchAPI('tasks.php', 'POST', {
            action: 'edit',
            id: taskId,
            title: taskTitle,
            category_id: taskCategoryId
        });
        
        // Mereset form dan menutup modal
        document.getElementById('editTaskModal').classList.remove('active');
        
        // Memperbarui daftar tugas dan hitungan
        await updateTaskCounts();
        await loadTasks();
        
    } catch (error) {
        showError('editTaskError', error.message);
    } finally {
        hideLoading();
    }
});

// Fungsi untuk menghapus tugas
async function deleteTask(taskId) {
    if (confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
        showLoading();
        
        try {
            await fetchAPI('tasks.php', 'POST', {
                action: 'delete',
                id: taskId
            });
            
            // Memperbarui daftar tugas dan hitungan
            await updateTaskCounts();
            await loadTasks();
            
        } catch (error) {
            alert('Terjadi kesalahan saat menghapus tugas: ' + error.message);
        } finally {
            hideLoading();
        }
    }
}

// Fungsi untuk menghapus kategori
async function deleteCategory(categoryId, categoryName) {
    if (confirm(`Apakah Anda yakin ingin menghapus kategori "${categoryName}"? Tugas yang ada akan dipindahkan ke kategori lain.`)) {
        showLoading();
        
        try {
            await fetchAPI('categories.php', 'POST', {
                action: 'delete',
                id: categoryId
            });
            
            // Jika kategori yang aktif dihapus, kembali ke "Semua"
            if (currentCategoryFilter === categoryId.toString()) {
                currentCategoryFilter = 'all';
                document.querySelectorAll('.category-item').forEach(item => {
                    item.classList.remove('active');
                });
                document.querySelector('.category-item[data-category="all"]').classList.add('active');
                document.getElementById('currentCategory').textContent = 'Semua Tugas';
            }
            
            // Memperbarui daftar kategori
            await loadCategories();
            
            // Memperbarui opsi kategori di modal tambah/edit tugas
            updateTaskCategoryOptions();
            
            // Memperbarui daftar tugas dan hitungan
            await updateTaskCounts();
            await loadTasks();
            
        } catch (error) {
            alert('Terjadi kesalahan saat menghapus kategori: ' + error.message);
        } finally {
            hideLoading();
        }
    }
}

// Fungsi untuk menandai tugas selesai
async function toggleTaskCompletion(taskId, completed) {
    showLoading();
    
    try {
        await fetchAPI('tasks.php', 'POST', {
            action: 'toggle_complete',
            id: taskId,
            completed: completed ? 'true' : 'false'
        });
        
        // Memperbarui daftar tugas
        await loadTasks();
        
    } catch (error) {
        alert('Terjadi kesalahan saat memperbarui status tugas: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Fungsi untuk membuka modal edit tugas
function openEditTaskModal(task) {
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskTitle').value = task.title;
    
    // Memilih kategori saat ini
    document.getElementById('editTaskCategory').value = task.category.id;
    
    // Membuka modal
    hideError('editTaskError');
    document.getElementById('editTaskModal').classList.add('active');
}

// Memeriksa status login saat halaman dimuat
document.addEventListener('DOMContentLoaded', async function() {
    showLoading();
    
    try {
        const result = await fetchAPI('auth.php?action=check_login');
        
        // User sudah login
        currentUser = {
            id: result.data.user_id,
            username: result.data.username,
            initial: result.data.username.charAt(0).toUpperCase()
        };
        
        // Menampilkan halaman aplikasi
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('appPage').style.display = 'block';
        
        // Update UI dengan info pengguna
        document.getElementById('userAvatar').textContent = currentUser.initial;
        document.getElementById('userName').textContent = currentUser.username;
        
        // Memuat kategori dan tugas
        await loadCategories();
        await updateTaskCounts();
        await loadTasks();
        
    } catch (error) {
        // User belum login, tetap di halaman login
        console.log('Pengguna belum login');
    } finally {
        hideLoading();
    }
});