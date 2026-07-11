USE inventory_management;

INSERT INTO categories(category_name, description)
VALUES
('Electronics','Electronic Products'),
('Furniture','Home Furniture'),
('Stationery','Office Stationery');

INSERT INTO suppliers(supplier_name,phone,email,address)
VALUES
('Dell','9876543210','dell@gmail.com','Bangalore'),
('HP','9876543211','hp@gmail.com','Mumbai'),
('Canon','9876543212','canon@gmail.com','Delhi');

INSERT INTO products
(product_name,price,stock,category_id,supplier_id)
VALUES
('Laptop',50000,10,1,1),
('Printer',15000,8,1,3),
('Chair',2500,15,2,2);