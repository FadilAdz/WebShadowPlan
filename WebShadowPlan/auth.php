<?php
// Memulai sesi
session_start();

// Memasukkan file konfigurasi
require_once 'config.php';

// Fungsi untuk pendaftaran pengguna baru
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'register') {
    $username = clean_input($_POST['username']);
    $password = $_POST['password'];
    
    // Memeriksa apakah username sudah ada
    $check_query = "SELECT id FROM users WHERE username = ?";
    $stmt = $conn->prepare($check_query);
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        json_response('error', 'Username sudah digunakan');
    }
    
    // Hash password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    // Menyimpan pengguna baru
    $insert_query = "INSERT INTO users (username, password) VALUES (?, ?)";
    $stmt = $conn->prepare($insert_query);
    $stmt->bind_param("ss", $username, $hashed_password);
    
    if ($stmt->execute()) {
        $user_id = $stmt->insert_id;
        
        // Menyiapkan sesi pengguna
        $_SESSION['user_id'] = $user_id;
        $_SESSION['username'] = $username;
        
        json_response('success', 'Pendaftaran berhasil', ['username' => $username, 'user_id' => $user_id]);
    } else {
        json_response('error', 'Terjadi kesalahan saat mendaftar: ' . $stmt->error);
    }
}

// Fungsi untuk login pengguna
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'login') {
    $username = clean_input($_POST['username']);
    $password = $_POST['password'];
    
    // Mengambil data pengguna
    $query = "SELECT id, username, password FROM users WHERE username = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        
        // Memeriksa password
        if (password_verify($password, $user['password'])) {
            // Menyiapkan sesi pengguna
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            
            json_response('success', 'Login berhasil', ['username' => $user['username'], 'user_id' => $user['id']]);
        } else {
            json_response('error', 'Password salah');
        }
    } else {
        json_response('error', 'Username tidak ditemukan');
    }
}

// Fungsi untuk logout
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'logout') {
    // Menghapus semua data sesi
    session_unset();
    session_destroy();
    
    json_response('success', 'Logout berhasil');
}

// Fungsi untuk memeriksa status login
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'check_login') {
    if (isset($_SESSION['user_id'])) {
        json_response('success', 'Pengguna sudah login', [
            'user_id' => $_SESSION['user_id'],
            'username' => $_SESSION['username']
        ]);
    } else {
        json_response('error', 'Pengguna belum login');
    }
}
?>