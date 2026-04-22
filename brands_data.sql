-- Create the brands table
CREATE TABLE IF NOT EXISTS brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand_name VARCHAR(100) NOT NULL,
    official_pattern VARCHAR(100) NOT NULL
);

-- Table: brands (Name, Official_VPA_Fragment)
INSERT INTO brands (brand_name, official_pattern) VALUES
('Amazon', '@apl'), ('Amazon', '@amazon'), ('Amazon', '@amazonpay'),
('Flipkart', '@fkrt'), ('Flipkart', '@ybl'),
('Zomato', '@zomato'), ('Swiggy', '@swiggy'),
('Airtel', '@airtel'), ('Jio', '@jio'), ('Reliance', '@ril'),
('Netflix', '@netflix'), ('Spotify', '@spotify'),
('Uber', '@uber'), ('Ola', '@ola'),
('Google', '@okgoogle'), ('Google', '@googlepay'),
('Microsoft', '@microsoft'), ('Apple', '@apple'),
('Starbucks', '@starbucks'), ('McDonalds', '@mcd'),
('HDFC Bank', '@hdfcbank'), ('ICICI Bank', '@icici'),
('SBI', '@sbi'), ('Paytm', '@paytm'),
('PhonePe', '@phonepe'), ('Indane', '@indane'),
('HP Gas', '@hpgas'), ('Tata Sky', '@tata'),
('DishTV', '@dishtv'), ('LIC', '@licindia'),
('PolicyBazaar', '@pb'), ('Cred', '@cred'),
('Myntra', '@myntra'), ('Ajio', '@ajio'),
('Dominos', '@dominos'), ('Pizza Hut', '@pizzahut'),
('BookMyShow', '@bms'), ('IRCTC', '@irctc'),
('MakeMyTrip', '@mmt'), ('Goibibo', '@go'),
('Blue Dart', '@bluedart'), ('Delhivery', '@delhivery'),
('Urban Company', '@uc'), ('BigBasket', '@bb'),
('Blinkit', '@blinkit'), ('Zepto', '@zepto'),
('Dunzo', '@dunzo'), ('Pharmeasy', '@pharmeasy'),
('Netmeds', '@netmeds'), ('1mg', '@1mg');


-- Table: blacklist (VPA, Reason)
INSERT INTO blacklist (vpa, reason) VALUES
('luckydraw77@upi', 'Lottery Scam'),
('win_iphone15@okaxis', 'Fake Giveway'),
('refund_helpdesk@ybl', 'Social Engineering'),
('customer.care.support@upi', 'Phishing'),
('kyc_verification@sbi', 'KYC Fraud'),
('olx_army_person@okicici', 'Second-hand Sale Scam'),
('paytm_cashback_offer@paytm', 'Cashback Fraud'),
('electricity_bill_pay@upi', 'Utility Bill Scam'),
('urgent_help_medical@oksbi', 'Impersonation Fraud'),
('amazon_gift_card@apl', 'Unauthorized Collection'),
('secure_pay_001@okaxis', 'Reported Fraud'), ('fast_refund_99@ybl', 'Phishing'),
('prize_winner_2024@upi', 'Lottery Scam'), ('bank_support_dept@sbi', 'KYC Fraud'),
('jio_recharge_offer@jio', 'Fake Offer'), ('army_officer_vpa@okicici', 'Advance Fee Scam'),
('google_pay_rewards@okgoogle', 'Cashback Fraud'), ('phonepe_help_desk@ybl', 'Phishing'),
('zomato_refund_care@zomato', 'Social Engineering'), ('flipkart_seller_support@fkrt', 'Fake Listing'),
('x8291ss@okaxis', 'Mule Account'), ('temp_pay_92@upi', 'Bot Account'),
('scam_detect_01@ybl', 'Irony Scam'), ('verified_user_82@oksbi', 'Identity Theft'),
('easy_loan_instant@upi', 'Loan Fraud'), ('pancard_update@sbi', 'Data Theft'),
('gift_voucher_claim@apl', 'Fake Reward'), ('courier_service_pay@upi', 'Delivery Scam'),
('insurance_claim_now@lic', 'Insurance Fraud'), ('stock_market_tips@okicici', 'Investment Scam');

