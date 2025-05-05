<?php
// Memulai sesi
session_start();

// Memasukkan file konfigurasi
require_once 'config.php';

// Memeriksa apakah pengguna sudah login
if (!isset($_SESSION['user_id'])) {
    json_response('error', 'Pengguna belum login');
}

$user_id = $_SESSION['user_id'];

// Mendapatkan semua tugas
if ($_SERVER['REQUEST_METHOD'] === 'GET' && (!isset($_GET['action']) || $_GET['action'] === 'get_all')) {
    $category_id = isset($_GET['category_id']) ? (int)$_GET['category_id'] : null;
    $search = isset($_GET['search']) ? clean_input($_GET['search']) : '';
    
    $query = "SELECT t.id, t.title, t.completed, t.created_at, c.id as category_id, c.name as category_name 
              FROM tasks t 
              JOIN categories c ON t.category_id = c.id 
              WHERE t.user_id = ?";
    
    $params = [$user_id];
    $types = "i";
    
    if ($category_id !== null) {
        $query .= " AND t.category_id = ?";
        $params[] = $category_id;
        $types .= "i";
    }
    
    if ($search !== '') {
        $query .= " AND t.title LIKE ?";
        $params[] = "%$search%";
        $types .= "s";
    }
    
    $query .= " ORDER BY t.created_at DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $tasks = [];
    while ($row = $result->fetch_assoc()) {
        $tasks[] = [
            'id' => $row['id'],
            'title' => $row['title'],
            'completed' => (bool)$row['completed'],
            'created_at' => $row['created_at'],
            'category' => [
                'id' => $row['category_id'],
                'name' => $row['category_name']
            ]
        ];
    }
    
    json_response('success', 'Tugas berhasil diambil', $tasks);
}

// Menambah tugas baru
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add') {
    $title = clean_input($_POST['title']);
    $category_id = (int)$_POST['category_id'];
    
    // Memeriksa apakah kategori ada dan milik pengguna
    $check_query = "SELECT id FROM categories WHERE id = ? AND user_id = ?";
    $stmt = $conn->prepare($check_query);
    $stmt->bind_param("ii", $category_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        json_response('error', 'Kategori tidak ditemukan');
    }
    
    // Menyimpan tugas baru
    $insert_query = "INSERT INTO tasks (user_id, category_id, title) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($insert_query);
    $stmt->bind_param("iis", $user_id, $category_id, $title);
    
    if ($stmt->execute()) {
        $task_id = $stmt->insert_id;
        
        // Mengambil detail kategori
        $cat_query = "SELECT name FROM categories WHERE id = ?";
        $stmt = $conn->prepare($cat_query);
        $stmt->bind_param("i", $category_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $category = $result->fetch_assoc();
        
        json_response('success', 'Tugas berhasil ditambahkan', [
            'id' => $task_id,
            'title' => $title,
            'completed' => false,
            'created_at' => date('Y-m-d H:i:s'),
            'category' => [
                'id' => $category_id,
                'name' => $category['name']
            ]
        ]);
    } else {
        json_response('error', 'Terjadi kesalahan saat menambahkan tugas: ' . $stmt->error);
    }
}

// Mengedit tugas
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'edit') {
    $task_id = (int)$_POST['id'];
    $title = clean_input($_POST['title']);
    $category_id = (int)$_POST['category_id'];
    
    // Memeriksa apakah tugas milik pengguna
    $check_query = "SELECT id FROM tasks WHERE id = ? AND user_id = ?";
    $stmt = $conn->prepare($check_query);
    $stmt->bind_param("ii", $task_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        json_response('error', 'Tugas tidak ditemukan');
    }
    
    // Memeriksa apakah kategori ada dan milik pengguna
    $check_cat_query = "SELECT id FROM categories WHERE id = ? AND user_id = ?";
    $stmt = $conn->prepare($check_cat_query);
    $stmt->bind_param("ii", $category_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        json_response('error', 'Kategori tidak ditemukan');
    }
    
    // Memperbarui tugas
    $update_query = "UPDATE tasks SET title = ?, category_id = ? WHERE id = ? AND user_id = ?";
    $stmt = $conn->prepare($update_query);
    $stmt->bind_param("siii", $title, $category_id, $task_id, $user_id);
    
    if ($stmt->execute()) {
        // Mengambil detail kategori
        $cat_query = "SELECT name FROM categories WHERE id = ?";
        $stmt = $conn->prepare($cat_query);
        $stmt->bind_param("i", $category_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $category = $result->fetch_assoc();
        
        json_response('success', 'Tugas berhasil diperbarui', [
            'id' => $task_id,
            'title' => $title,
            'category' => [
                'id' => $category_id,
                'name' => $category['name']
            ]
        ]);
    } else {
        json_response('error', 'Terjadi kesalahan saat memperbarui tugas: ' . $stmt->error);
    }
}

// Menandai tugas selesai/belum selesai
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'toggle_complete') {
    $task_id = (int)$_POST['id'];
    $completed = (isset($_POST['completed']) && $_POST['completed'] === 'true') ? 1 : 0;
    
    // Memeriksa apakah tugas milik pengguna
    $check_query = "SELECT id FROM tasks WHERE id = ? AND user_id = ?";
    $stmt = $conn->prepare($check_query);
    $stmt->bind_param("ii", $task_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        json_response('error', 'Tugas tidak ditemukan');
    }
    
    // Memperbarui status tugas
    $update_query = "UPDATE tasks SET completed = ? WHERE id = ? AND user_id = ?";
    $stmt = $conn->prepare($update_query);
    $stmt->bind_param("iii", $completed, $task_id, $user_id);
    
    if ($stmt->execute()) {
        json_response('success', 'Status tugas berhasil diperbarui', [
            'id' => $task_id,
            'completed' => (bool)$completed
        ]);
    } else {
        json_response('error', 'Terjadi kesalahan saat memperbarui status tugas: ' . $stmt->error);
    }
}

// Menghapus tugas
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'delete') {
    $task_id = (int)$_POST['id'];
    
    // Memeriksa apakah tugas milik pengguna
    $check_query = "SELECT id FROM tasks WHERE id = ? AND user_id = ?";
    $stmt = $conn->prepare($check_query);
    $stmt->bind_param("ii", $task_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        json_response('error', 'Tugas tidak ditemukan');
    }
    
    // Menghapus tugas
    $delete_query = "DELETE FROM tasks WHERE id = ? AND user_id = ?";
    $stmt = $conn->prepare($delete_query);
    $stmt->bind_param("ii", $task_id, $user_id);
    
    if ($stmt->execute()) {
        json_response('success', 'Tugas berhasil dihapus');
    } else {
        json_response('error', 'Terjadi kesalahan saat menghapus tugas: ' . $stmt->error);
    }
}

// Mendapatkan total tugas per kategori
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'count_by_category') {
    $query = "SELECT c.id, c.name, COUNT(t.id) as task_count 
              FROM categories c 
              LEFT JOIN tasks t ON c.id = t.category_id AND t.user_id = c.user_id 
              WHERE c.user_id = ? 
              GROUP BY c.id";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $counts = [];
    while ($row = $result->fetch_assoc()) {
        $counts[] = [
            'category_id' => $row['id'],
            'category_name' => $row['name'],
            'task_count' => (int)$row['task_count']
        ];
    }
    
    // Menambahkan total semua tugas
    $total_query = "SELECT COUNT(*) as total FROM tasks WHERE user_id = ?";
    $stmt = $conn->prepare($total_query);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    
    $counts[] = [
        'category_id' => 'all',
        'category_name' => 'Semua',
        'task_count' => (int)$row['total']
    ];
    
    json_response('success', 'Jumlah tugas per kategori berhasil diambil', $counts);
}

// Jika tidak ada tindakan yang cocok
json_response('error', 'Tindakan tidak valid');
?>