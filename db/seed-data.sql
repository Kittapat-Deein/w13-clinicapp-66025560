-- Whiskey Reservation App — seed data

INSERT INTO whiskeys (name, category, origin, description, price, icon) VALUES
  (N'Scotch Whisky',    N'Single Malt & Blended', N'Scotland', N'กลิ่นสโมคกี้เข้มข้น นุ่มลึก หมักบ่มในถังไม้โอ๊คสก็อตแลนด์', N'฿2,890', N'🥃'),
  (N'American Whiskey', N'Bourbon & Rye',         N'USA',      N'รสสัมผัสหวานละมุน วานิลลา คาราเมล และโอ๊คเข้มข้น', N'฿2,250', N'🍸'),
  (N'Japanese Whisky',  N'Mizunara Cask Crafted', N'Japan',    N'นุ่มนวล ซับซ้อน กลิ่นดอกไม้และไม้หอมมิซูนาระอันเป็นเอกลักษณ์', N'฿3,990', N'🍶'),
  (N'Irish Whiskey',    N'Triple Distilled',      N'Ireland',  N'กลั่น 3 ครั้ง รสสัมผัสนุ่มละมุนที่สุด กลิ่นผลไม้สุกและน้ำผึ้ง', N'฿1,990', N'🥂');
