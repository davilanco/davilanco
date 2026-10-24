<?php
header('Access-Control-Allow-Origin: https://davilanco.com');
header('Content-Type: application/json');

$conn = new mysqli("localhost", "db_user", "db_password", "db_name");
if($conn->connect_error) die("Connection failed");

$name = $conn->real_escape_string($_POST['name']);
$message = $conn->real_escape_string($_POST['message']);

$sql = "INSERT INTO posts (name, message) VALUES ('$name', '$message')";
$conn->query($sql);
echo json_encode(["success" => true]);
?>
<?php
$name = $_POST['name'];  // Get what user typed in HTML
echo "Hello " . $name;
?>
