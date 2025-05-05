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

// Mendapatkan semua kategori
if ($_SERVER['REQUEST_METHOD'] === 'GET' && (!isset($_GET['action']) || $_GET['action'] === 'get_all')) {
    $query = "SELECT id, name FROM categories WHERE user_id = ? ORDER BY name";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $categories = [];
    while ($row = $result->fetch_assoc()) {
        $categories[] = $row;
    }
    
    json_response('success', 'Kategori berhasil diambil', $categories);
}

// Menambah kategori baru
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add') {
    $name = clean_input($_POST['name']);
    
    // Memeriksa apakah kategori sudah ada
    $check_query = "SELECT id FROM categories WHERE user_id = ? AND name = ?";
    $stmt = $conn->prepare($check_query);
    $stmt->bind_param("is", $user_id, $name);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        json_response('error', 'Kategori sudah ada');
    }
    
    // Menyimpan kategori baru
    $insert_query = "INSERT INTO categories (user_id, name) VALUES (?, ?)";
    $stmt = $conn->prepare($insert_query);
    $stmt->bind_param("is", $user_id, $name);
    
    if ($stmt->execute()) {
        $category_id = $stmt->insert_id;
        json_response('success', 'Kategori berhasil ditambahkan', ['id' => $category_id, 'name' => $name]);
    } else {
        json_response('error', 'Terjadi kesalahan saat menambahkan kategori: ' . $stmt->error);
    }
}

// Mengedit kategori
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'edit') {
    $category_id = (int)$_POST['id'];
    $name = clean_input($_POST['name']);
    
    // Memeriksa apakah kategori milik pengguna
    $check_query = "SELECT id FROM categories WHERE id = ? AND user_id = ?";
    $stmt = $conn->prepare($check_query);
    $stmt->bind_param("ii", $category_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        json_response('error', 'Kategori tidak ditemukan');
    }
    
    // Memeriksa apakah nama baru sudah ada
    $check_name_query = "SELECT id FROM categories WHERE user_id = ? AND name = ? AND id != ?";
    $stmt = $conn->prepare($check_name_query);
    $stmt->bind_param("isi", $user_id, $name, $category_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        json_response('error', 'Nama kategori sudah digunakan');
    }
    
    // Memperbarui kategori
    $update_query = "UPDATE categories SET name = ? WHERE id = ? AND user_id = ?";
    $stmt = $conn->prepare($update_query);
    $stmt->bind_param("sii", $name, $category_id, $user_id);
    
    if ($stmt->execute()) {
        json_response('success', 'Kategori berhasil diperbarui', ['id' => $category_id, 'name' => $name]);
    } else {
        json_response('error', 'Terjadi kesalahan saat memperbarui kategori: ' . $stmt->error);
    }
}

// Menghapus kategori
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'delete') {
    $category_id = (int)$_POST['id'];
    
    // Memeriksa apakah kategori milik pengguna
    $check_query = "SELECT id FROM categories WHERE id = ? AND user_id = ?";
    $stmt = $conn->prepare($check_query);
    $stmt->bind_param("ii", $category_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        json_response('error', 'Kategori tidak ditemukan');
    }
    
    // Memeriksa apakah ada tugas yang menggunakan kategori ini
    $check_tasks_query = "SELECT COUNT(*) as task_count FROM tasks WHERE category_id = ? AND user_id = ?";
    $stmt = $conn->prepare($check_tasks_query);
    $stmt->bind_param("ii", $category_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    
    if ($row['task_count'] > 0) {
        // Jika ada tugas yang menggunakan kategori, pindahkan ke kategori default
        // Ambil kategori default (misalnya yang pertama)
        $default_category_query = "SELECT id FROM categories WHERE user_id = ? AND id != ? LIMIT 1";
        $stmt = $conn->prepare($default_category_query);
        $stmt->bind_param("ii", $user_id, $category_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            json_response('error', 'Tidak dapat menghapus kategori terakhir');
        }
        
        $default_category = $result->fetch_assoc();
        $default_category_id = $default_category['id'];
        
        // Pindahkan semua tugas ke kategori default
        $move_tasks_query = "UPDATE tasks SET category_id = ? WHERE category_id = ? AND user_id = ?";
        $stmt = $conn->prepare($move_tasks_query);
        $stmt->bind_param("iii", $default_category_id, $category_id, $user_id);
        $stmt->execute();
    }
    
    // Menghapus kategori
    $delete_query = "DELETE FROM categories WHERE id = ? AND user_id = ?";
    $stmt = $conn->prepare($delete_query);
    $stmt->bind_param("ii", $category_id, $user_id);
    
    if ($stmt->execute()) {
        json_response('success', 'Kategori berhasil dihapus');
    } else {
        json_response('error', 'Terjadi kesalahan saat menghapus kategori: ' . $stmt->error);
    }
}

// Jika tidak ada tindakan yang cocok
json_response('error', 'Tindakan tidak valid');
?>