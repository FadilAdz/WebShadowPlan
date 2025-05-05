<?php
// Konfigurasi database
$host = 'localhost'; // hostname
$db_username = 'root'; // username database
$db_password = ''; // password database
$db_name = 'todo_app'; // nama database

// Membuat koneksi
$conn = new mysqli($host, $db_username, $db_password, $db_name);

// Memeriksa koneksi
if ($conn->connect_error) {
    die("Koneksi gagal: " . $conn->connect_error);
}

// Set character set
$conn->set_charset("utf8");

// Fungsi untuk membersihkan input dari potensi serangan
function clean_input($data) {
    global $conn;
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    $data = $conn->real_escape_string($data);
    return $data;
}

// Fungsi untuk mendapatkan respons JSON
function json_response($status, $message, $data = null) {
    $response = array(
        'status' => $status,
        'message' => $message
    );
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}
?>