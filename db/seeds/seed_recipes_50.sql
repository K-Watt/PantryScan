-- Seed: 50 test recipes for PantryScan
-- Run once against PantryScanDB to populate test data.
-- Safe to re-run: uses WHERE NOT EXISTS to avoid duplicates.

SET NOCOUNT ON;

DECLARE @recipes TABLE (
    Name          NVARCHAR(200),
    Course        NVARCHAR(100),
    Cuisine       NVARCHAR(300),
    Source        NVARCHAR(200),
    TagsJson      NVARCHAR(MAX),
    Rating        INT,
    Servings      INT,
    IngredientsJson NVARCHAR(MAX),
    StepsJson     NVARCHAR(MAX)
);

INSERT INTO @recipes VALUES
-- 1
('Spaghetti Carbonara', 'Dinner', 'Italian', 'classic',
 '["Pasta","Quick","Weeknight"]', 4, 4,
 '[{"name":"spaghetti","amount":"400g"},{"name":"pancetta","amount":"150g"},{"name":"eggs","amount":"3"},{"name":"parmesan","amount":"60g"},{"name":"black pepper","amount":"to taste"},{"name":"salt","amount":"to taste"}]',
 '["Boil spaghetti in salted water until al dente.","Fry pancetta in a pan until crispy.","Whisk eggs with parmesan and pepper.","Drain pasta, reserving 1 cup pasta water.","Off heat, toss pasta with pancetta, then egg mixture, adding pasta water to loosen.","Serve immediately."]'),
-- 2
('Chicken Tikka Masala', 'Dinner', 'Indian', 'classic',
 '["Chicken","Curry","Spicy"]', 5, 6,
 '[{"name":"chicken breast","amount":"800g"},{"name":"plain yogurt","amount":"200ml"},{"name":"garam masala","amount":"2 tsp"},{"name":"turmeric","amount":"1 tsp"},{"name":"tomato puree","amount":"400g"},{"name":"heavy cream","amount":"150ml"},{"name":"onion","amount":"1 large"},{"name":"garlic cloves","amount":"4"},{"name":"ginger","amount":"1 tbsp"}]',
 '["Marinate chicken in yogurt and half the spices for 1 hour.","Grill or broil chicken until charred; set aside.","Sauté onion, garlic, ginger until soft.","Add remaining spices and tomato puree; simmer 15 min.","Stir in cream and chicken; simmer 10 min.","Serve with basmati rice or naan."]'),
-- 3
('Classic Beef Tacos', 'Dinner', 'Mexican', 'classic',
 '["Beef","Tacos","Quick"]', 4, 4,
 '[{"name":"ground beef","amount":"500g"},{"name":"taco seasoning","amount":"2 tbsp"},{"name":"corn tortillas","amount":"8"},{"name":"shredded cheese","amount":"1 cup"},{"name":"lettuce","amount":"1 cup"},{"name":"diced tomato","amount":"1"},{"name":"sour cream","amount":"to serve"}]',
 '["Brown ground beef in a skillet; drain fat.","Add taco seasoning and 1/4 cup water; simmer 5 min.","Warm tortillas.","Assemble tacos with beef, cheese, lettuce, tomato, sour cream."]'),
-- 4
('Vegetable Stir-Fry', 'Dinner', 'Chinese', 'classic',
 '["Vegetarian","Quick","Healthy"]', 3, 4,
 '[{"name":"broccoli florets","amount":"2 cups"},{"name":"snap peas","amount":"1 cup"},{"name":"bell pepper","amount":"1"},{"name":"carrots","amount":"2"},{"name":"soy sauce","amount":"3 tbsp"},{"name":"sesame oil","amount":"1 tbsp"},{"name":"garlic","amount":"3 cloves"},{"name":"ginger","amount":"1 tsp"},{"name":"cornstarch","amount":"1 tsp"}]',
 '["Mix soy sauce, sesame oil, cornstarch for sauce.","Heat wok over high heat with oil.","Stir-fry garlic and ginger 30 seconds.","Add vegetables in order of cooking time; stir-fry 5 min.","Pour sauce over; toss until glossy.","Serve over rice."]'),
-- 5
('Banana Pancakes', 'Breakfast', 'American', 'classic',
 '["Breakfast","Sweet","Quick"]', 4, 2,
 '[{"name":"ripe banana","amount":"1"},{"name":"egg","amount":"2"},{"name":"flour","amount":"1/2 cup"},{"name":"milk","amount":"1/4 cup"},{"name":"baking powder","amount":"1 tsp"},{"name":"butter","amount":"for cooking"}]',
 '["Mash banana well.","Whisk in eggs and milk.","Fold in flour and baking powder.","Cook spoonfuls on buttered skillet over medium heat, 2 min per side.","Serve with maple syrup."]'),
-- 6
('French Onion Soup', 'Lunch', 'French', 'classic',
 '["Soup","Comfort","Cheese"]', 5, 4,
 '[{"name":"yellow onions","amount":"4 large"},{"name":"butter","amount":"3 tbsp"},{"name":"beef broth","amount":"4 cups"},{"name":"dry white wine","amount":"1/2 cup"},{"name":"thyme","amount":"1 tsp"},{"name":"baguette slices","amount":"4"},{"name":"Gruyere cheese","amount":"1 cup"}]',
 '["Caramelize onions in butter over low heat 45 min until deep golden.","Add wine; cook 2 min.","Add broth and thyme; simmer 20 min.","Ladle into oven-safe bowls; top with bread and cheese.","Broil until cheese is bubbly and brown."]'),
-- 7
('Avocado Toast', 'Breakfast', 'American', 'classic',
 '["Breakfast","Vegetarian","Quick"]', 4, 2,
 '[{"name":"sourdough bread","amount":"2 slices"},{"name":"ripe avocado","amount":"1"},{"name":"lemon juice","amount":"1 tsp"},{"name":"red pepper flakes","amount":"pinch"},{"name":"salt","amount":"to taste"},{"name":"egg","amount":"2 optional"}]',
 '["Toast bread until golden.","Mash avocado with lemon juice and salt.","Spread on toast.","Top with red pepper flakes and optional poached egg."]'),
-- 8
('Beef and Broccoli', 'Dinner', 'Chinese-American', 'classic',
 '["Beef","Quick","Takeout"]', 4, 4,
 '[{"name":"flank steak","amount":"500g"},{"name":"broccoli","amount":"3 cups"},{"name":"oyster sauce","amount":"3 tbsp"},{"name":"soy sauce","amount":"2 tbsp"},{"name":"sesame oil","amount":"1 tsp"},{"name":"garlic","amount":"3 cloves"},{"name":"cornstarch","amount":"2 tsp"}]',
 '["Slice steak thin against the grain; toss with cornstarch.","Mix oyster sauce, soy sauce, sesame oil.","Stir-fry beef in hot oil until browned; remove.","Stir-fry broccoli and garlic 3 min.","Return beef; add sauce; toss to coat.","Serve over rice."]'),
-- 9
('Lemon Garlic Salmon', 'Dinner', 'Mediterranean', 'classic',
 '["Fish","Healthy","Quick"]', 5, 4,
 '[{"name":"salmon fillets","amount":"4"},{"name":"lemon","amount":"1"},{"name":"garlic cloves","amount":"4"},{"name":"olive oil","amount":"2 tbsp"},{"name":"fresh dill","amount":"2 tbsp"},{"name":"salt","amount":"to taste"},{"name":"black pepper","amount":"to taste"}]',
 '["Preheat oven to 400°F (200°C).","Place salmon on baking sheet; drizzle with oil.","Top with sliced garlic, lemon slices, dill, salt, pepper.","Bake 12–15 min until flakes easily."]'),
-- 10
('Margherita Pizza', 'Dinner', 'Italian', 'classic',
 '["Pizza","Vegetarian","Weekend"]', 5, 4,
 '[{"name":"pizza dough","amount":"1 ball"},{"name":"tomato sauce","amount":"1/2 cup"},{"name":"fresh mozzarella","amount":"200g"},{"name":"fresh basil leaves","amount":"handful"},{"name":"olive oil","amount":"1 tbsp"},{"name":"salt","amount":"to taste"}]',
 '["Preheat oven to 500°F (260°C) with a pizza stone if available.","Stretch dough on a floured surface.","Spread tomato sauce; add torn mozzarella.","Bake 8–10 min until crust is golden.","Top with fresh basil and a drizzle of olive oil."]'),
-- 11
('Chicken Caesar Salad', 'Lunch', 'American', 'classic',
 '["Salad","Chicken","Lunch"]', 4, 4,
 '[{"name":"romaine lettuce","amount":"2 heads"},{"name":"grilled chicken breast","amount":"2"},{"name":"parmesan","amount":"1/3 cup"},{"name":"croutons","amount":"1 cup"},{"name":"Caesar dressing","amount":"1/3 cup"},{"name":"lemon juice","amount":"1 tbsp"}]',
 '["Chop romaine and place in a large bowl.","Slice grilled chicken.","Toss lettuce with dressing and lemon juice.","Top with chicken, croutons, and parmesan."]'),
-- 12
('Black Bean Soup', 'Lunch', 'Latin American', 'classic',
 '["Soup","Vegetarian","Healthy"]', 4, 6,
 '[{"name":"black beans","amount":"2 cans"},{"name":"onion","amount":"1"},{"name":"garlic","amount":"4 cloves"},{"name":"cumin","amount":"2 tsp"},{"name":"chicken broth","amount":"4 cups"},{"name":"lime juice","amount":"2 tbsp"},{"name":"sour cream","amount":"to serve"}]',
 '["Sauté onion and garlic until soft.","Add cumin; cook 1 min.","Add beans and broth; simmer 20 min.","Blend half the soup; stir back in.","Add lime juice; season.","Serve with sour cream."]'),
-- 13
('Shakshuka', 'Breakfast', 'Middle Eastern', 'classic',
 '["Eggs","Breakfast","Spicy","One-Pan"]', 5, 4,
 '[{"name":"eggs","amount":"6"},{"name":"crushed tomatoes","amount":"400g"},{"name":"red bell pepper","amount":"1"},{"name":"onion","amount":"1"},{"name":"cumin","amount":"1 tsp"},{"name":"paprika","amount":"1 tsp"},{"name":"cayenne","amount":"1/4 tsp"},{"name":"feta","amount":"60g optional"}]',
 '["Sauté onion and pepper until soft.","Add spices; cook 1 min.","Pour in tomatoes; simmer 10 min.","Make wells; crack eggs in.","Cover and cook until whites are set.","Top with feta; serve with crusty bread."]'),
-- 14
('Pulled Pork Sandwich', 'Lunch', 'American BBQ', 'classic',
 '["Pork","BBQ","Weekend","Slow-Cook"]', 5, 8,
 '[{"name":"pork shoulder","amount":"1.5kg"},{"name":"BBQ rub","amount":"3 tbsp"},{"name":"apple cider vinegar","amount":"1/4 cup"},{"name":"BBQ sauce","amount":"1 cup"},{"name":"brioche buns","amount":"8"},{"name":"coleslaw","amount":"to serve"}]',
 '["Coat pork in rub; refrigerate overnight.","Cook in slow cooker on low 8 hours.","Shred pork; mix with vinegar and BBQ sauce.","Serve on buns with coleslaw."]'),
-- 15
('Greek Salad', 'Lunch', 'Greek', 'classic',
 '["Salad","Vegetarian","Healthy","Quick"]', 4, 4,
 '[{"name":"cucumber","amount":"1"},{"name":"cherry tomatoes","amount":"200g"},{"name":"kalamata olives","amount":"1/2 cup"},{"name":"feta cheese","amount":"150g"},{"name":"red onion","amount":"1/2"},{"name":"olive oil","amount":"3 tbsp"},{"name":"dried oregano","amount":"1 tsp"},{"name":"lemon juice","amount":"2 tbsp"}]',
 '["Chop cucumber and halve tomatoes.","Combine with olives and sliced onion.","Drizzle with oil and lemon juice.","Top with feta and oregano."]'),
-- 16
('Mushroom Risotto', 'Dinner', 'Italian', 'classic',
 '["Vegetarian","Comfort","Weekend"]', 4, 4,
 '[{"name":"arborio rice","amount":"1.5 cups"},{"name":"mixed mushrooms","amount":"300g"},{"name":"onion","amount":"1"},{"name":"garlic","amount":"2 cloves"},{"name":"white wine","amount":"1/2 cup"},{"name":"vegetable broth","amount":"4 cups warm"},{"name":"parmesan","amount":"60g"},{"name":"butter","amount":"2 tbsp"}]',
 '["Sauté onion and garlic; add mushrooms until golden.","Add rice; toast 1 min.","Add wine; stir until absorbed.","Add broth one ladle at a time, stirring constantly, ~20 min.","Stir in butter and parmesan; serve immediately."]'),
-- 17
('Turkey Meatballs', 'Dinner', 'Italian-American', 'classic',
 '["Turkey","Healthy","Meal-Prep"]', 4, 6,
 '[{"name":"ground turkey","amount":"700g"},{"name":"breadcrumbs","amount":"1/2 cup"},{"name":"egg","amount":"1"},{"name":"parmesan","amount":"1/4 cup"},{"name":"garlic","amount":"2 cloves"},{"name":"Italian seasoning","amount":"1 tsp"},{"name":"marinara sauce","amount":"2 cups"}]',
 '["Mix turkey with breadcrumbs, egg, parmesan, garlic, and seasoning.","Roll into 1.5-inch balls.","Brown in oil on all sides.","Simmer in marinara 15 min.","Serve over pasta or as sub filling."]'),
-- 18
('Pad Thai', 'Dinner', 'Thai', 'classic',
 '["Noodles","Takeout","Quick"]', 5, 4,
 '[{"name":"rice noodles","amount":"200g"},{"name":"shrimp or chicken","amount":"250g"},{"name":"eggs","amount":"2"},{"name":"bean sprouts","amount":"1 cup"},{"name":"fish sauce","amount":"3 tbsp"},{"name":"tamarind paste","amount":"2 tbsp"},{"name":"brown sugar","amount":"1 tbsp"},{"name":"green onions","amount":"3"},{"name":"crushed peanuts","amount":"1/4 cup"},{"name":"lime","amount":"1"}]',
 '["Soak noodles per package; drain.","Stir-fry protein; push aside, scramble eggs.","Add noodles, sauce (fish sauce + tamarind + sugar).","Toss in bean sprouts and green onions.","Serve topped with peanuts and lime."]'),
-- 19
('Blueberry Muffins', 'Breakfast', 'American', 'classic',
 '["Baking","Breakfast","Sweet"]', 4, 12,
 '[{"name":"all-purpose flour","amount":"2 cups"},{"name":"sugar","amount":"3/4 cup"},{"name":"baking powder","amount":"2 tsp"},{"name":"salt","amount":"1/2 tsp"},{"name":"milk","amount":"3/4 cup"},{"name":"vegetable oil","amount":"1/3 cup"},{"name":"egg","amount":"1"},{"name":"blueberries","amount":"1.5 cups"}]',
 '["Preheat oven to 375°F (190°C); line muffin tin.","Mix dry ingredients.","Whisk wet ingredients; fold into dry until just combined.","Fold in blueberries.","Divide into tin; bake 20–25 min."]'),
-- 20
('Chicken Soup', 'Lunch', 'American', 'classic',
 '["Soup","Comfort","Healthy"]', 5, 8,
 '[{"name":"whole chicken","amount":"1.5kg"},{"name":"carrots","amount":"3"},{"name":"celery stalks","amount":"3"},{"name":"onion","amount":"1"},{"name":"garlic","amount":"4 cloves"},{"name":"egg noodles","amount":"2 cups"},{"name":"fresh parsley","amount":"1/4 cup"},{"name":"salt and pepper","amount":"to taste"}]',
 '["Simmer chicken in water 1 hour; remove and shred.","Strain broth; return to pot.","Add chopped vegetables; simmer 15 min.","Add noodles; cook 8 min.","Return chicken; add parsley; season."]'),
-- 21
('Beef Chili', 'Dinner', 'American', 'classic',
 '["Beef","Spicy","Meal-Prep","Slow-Cook"]', 5, 8,
 '[{"name":"ground beef","amount":"700g"},{"name":"kidney beans","amount":"2 cans"},{"name":"crushed tomatoes","amount":"800g"},{"name":"onion","amount":"1"},{"name":"chili powder","amount":"2 tbsp"},{"name":"cumin","amount":"1 tsp"},{"name":"garlic","amount":"4 cloves"},{"name":"beef broth","amount":"1 cup"}]',
 '["Brown beef; drain fat.","Sauté onion and garlic.","Add spices; cook 1 min.","Add tomatoes, beans, broth.","Simmer 30 min.","Serve with cheese, sour cream, green onions."]'),
-- 22
('Chocolate Chip Cookies', 'Dessert', 'American', 'classic',
 '["Baking","Dessert","Sweet"]', 5, 24,
 '[{"name":"all-purpose flour","amount":"2.25 cups"},{"name":"butter","amount":"225g softened"},{"name":"white sugar","amount":"3/4 cup"},{"name":"brown sugar","amount":"3/4 cup"},{"name":"eggs","amount":"2"},{"name":"vanilla","amount":"2 tsp"},{"name":"baking soda","amount":"1 tsp"},{"name":"salt","amount":"1 tsp"},{"name":"chocolate chips","amount":"2 cups"}]',
 '["Preheat oven to 375°F (190°C).","Beat butter and sugars until fluffy.","Add eggs and vanilla.","Mix in flour, baking soda, salt.","Stir in chips.","Drop spoonfuls onto sheet; bake 9–11 min."]'),
-- 23
('Guacamole', 'Snack', 'Mexican', 'classic',
 '["Snack","Vegetarian","Quick","Dip"]', 5, 4,
 '[{"name":"ripe avocados","amount":"3"},{"name":"lime juice","amount":"2 tbsp"},{"name":"white onion","amount":"1/4"},{"name":"jalapeño","amount":"1"},{"name":"cilantro","amount":"2 tbsp"},{"name":"salt","amount":"to taste"},{"name":"tomato","amount":"1 small"}]',
 '["Halve and pit avocados; scoop flesh.","Mash to desired texture.","Fold in finely diced onion, jalapeño, cilantro, tomato.","Add lime juice and salt.","Taste and adjust.","Serve immediately."]'),
-- 24
('Grilled Cheese Sandwich', 'Lunch', 'American', 'classic',
 '["Quick","Comfort","Vegetarian"]', 4, 2,
 '[{"name":"sourdough bread","amount":"4 slices"},{"name":"cheddar cheese","amount":"150g"},{"name":"butter","amount":"2 tbsp"},{"name":"Dijon mustard","amount":"1 tsp optional"}]',
 '["Butter one side of each bread slice.","Place buttered side down; add cheese.","Optionally spread mustard inside.","Top with second slice butter-side up.","Cook in skillet over medium heat 3 min per side until golden."]'),
-- 25
('Shrimp Scampi', 'Dinner', 'Italian-American', 'classic',
 '["Seafood","Quick","Pasta"]', 5, 4,
 '[{"name":"large shrimp","amount":"500g peeled"},{"name":"linguine","amount":"300g"},{"name":"butter","amount":"4 tbsp"},{"name":"olive oil","amount":"2 tbsp"},{"name":"garlic","amount":"6 cloves"},{"name":"white wine","amount":"1/2 cup"},{"name":"lemon juice","amount":"2 tbsp"},{"name":"parsley","amount":"1/4 cup"},{"name":"red pepper flakes","amount":"1/4 tsp"}]',
 '["Cook pasta; reserve 1/2 cup pasta water.","Sauté garlic in butter and oil 1 min.","Add shrimp; cook 2 min per side.","Add wine; simmer 2 min.","Toss with pasta, lemon, parsley, pepper flakes.","Add pasta water as needed."]'),
-- 26
('Overnight Oats', 'Breakfast', 'American', 'classic',
 '["Breakfast","Healthy","Meal-Prep","No-Cook"]', 4, 2,
 '[{"name":"rolled oats","amount":"1 cup"},{"name":"milk or oat milk","amount":"1 cup"},{"name":"chia seeds","amount":"1 tbsp"},{"name":"honey","amount":"1 tbsp"},{"name":"vanilla","amount":"1/2 tsp"},{"name":"fruit toppings","amount":"to serve"}]',
 '["Combine oats, milk, chia seeds, honey, vanilla in a jar.","Stir well.","Refrigerate overnight or at least 4 hours.","Serve topped with fresh fruit."]'),
-- 27
('Butter Chicken', 'Dinner', 'Indian', 'classic',
 '["Chicken","Curry","Mild"]', 5, 6,
 '[{"name":"chicken thighs","amount":"800g"},{"name":"butter","amount":"4 tbsp"},{"name":"onion","amount":"1"},{"name":"garlic","amount":"4 cloves"},{"name":"ginger","amount":"1 tbsp"},{"name":"garam masala","amount":"2 tsp"},{"name":"tomato puree","amount":"400g"},{"name":"heavy cream","amount":"200ml"},{"name":"sugar","amount":"1 tsp"}]',
 '["Brown chicken in butter; set aside.","Sauté onion, garlic, ginger.","Add spices; cook 1 min.","Add tomato puree; simmer 15 min.","Blend sauce until smooth.","Return chicken; stir in cream and sugar.","Simmer 10 min."]'),
-- 28
('Fish Tacos', 'Dinner', 'Mexican', 'classic',
 '["Fish","Tacos","Quick"]', 4, 4,
 '[{"name":"white fish fillets","amount":"500g"},{"name":"lime juice","amount":"2 tbsp"},{"name":"cumin","amount":"1 tsp"},{"name":"smoked paprika","amount":"1 tsp"},{"name":"corn tortillas","amount":"8"},{"name":"shredded cabbage","amount":"1 cup"},{"name":"avocado","amount":"1"},{"name":"sour cream","amount":"1/4 cup"},{"name":"cilantro","amount":"to taste"}]',
 '["Marinate fish in lime, cumin, paprika 15 min.","Grill or pan-fry fish 3 min per side.","Warm tortillas.","Assemble with fish, cabbage, avocado, sour cream, cilantro."]'),
-- 29
('Hummus', 'Snack', 'Middle Eastern', 'classic',
 '["Snack","Vegetarian","Dip","Healthy"]', 5, 8,
 '[{"name":"chickpeas","amount":"1 can"},{"name":"tahini","amount":"3 tbsp"},{"name":"lemon juice","amount":"3 tbsp"},{"name":"garlic","amount":"1 clove"},{"name":"olive oil","amount":"2 tbsp"},{"name":"cumin","amount":"1/2 tsp"},{"name":"ice water","amount":"2 tbsp"},{"name":"salt","amount":"to taste"}]',
 '["Drain and rinse chickpeas.","Blend tahini and lemon juice 1 min.","Add garlic and chickpeas; blend.","Add olive oil and cumin; blend smooth.","Add ice water; blend until light.","Season; drizzle oil to serve."]'),
-- 30
('Potato Leek Soup', 'Lunch', 'French', 'classic',
 '["Soup","Vegetarian","Comfort"]', 4, 6,
 '[{"name":"leeks","amount":"3"},{"name":"Yukon Gold potatoes","amount":"500g"},{"name":"butter","amount":"2 tbsp"},{"name":"vegetable broth","amount":"4 cups"},{"name":"heavy cream","amount":"1/2 cup"},{"name":"thyme","amount":"1 tsp"},{"name":"salt and pepper","amount":"to taste"}]',
 '["Slice leeks; sauté in butter until soft.","Add diced potatoes and thyme.","Pour in broth; simmer 20 min until potatoes are tender.","Blend until smooth.","Stir in cream; season.","Serve hot or cold (vichyssoise)."]'),
-- 31
('BBQ Ribs', 'Dinner', 'American BBQ', 'classic',
 '["Pork","BBQ","Weekend"]', 5, 4,
 '[{"name":"pork spare ribs","amount":"1.5kg"},{"name":"dry rub","amount":"3 tbsp"},{"name":"BBQ sauce","amount":"1 cup"},{"name":"apple cider vinegar","amount":"2 tbsp"},{"name":"garlic powder","amount":"1 tsp"}]',
 '["Remove membrane from ribs; apply rub.","Wrap in foil; bake at 275°F (135°C) for 3 hours.","Unwrap; brush with BBQ sauce.","Grill or broil 10 min until caramelized.","Rest 5 min before cutting."]'),
-- 32
('Caprese Salad', 'Lunch', 'Italian', 'classic',
 '["Salad","Vegetarian","Quick","No-Cook"]', 4, 4,
 '[{"name":"fresh mozzarella","amount":"250g"},{"name":"heirloom tomatoes","amount":"3"},{"name":"fresh basil","amount":"1/2 cup"},{"name":"olive oil","amount":"3 tbsp"},{"name":"balsamic glaze","amount":"2 tbsp"},{"name":"salt and pepper","amount":"to taste"}]',
 '["Slice mozzarella and tomatoes.","Arrange alternating slices on a plate.","Tuck basil between slices.","Drizzle with oil and balsamic.","Season with salt and pepper."]'),
-- 33
('Vegetable Curry', 'Dinner', 'Indian', 'classic',
 '["Vegetarian","Curry","Healthy"]', 4, 6,
 '[{"name":"sweet potato","amount":"2"},{"name":"chickpeas","amount":"1 can"},{"name":"spinach","amount":"2 cups"},{"name":"coconut milk","amount":"400ml"},{"name":"curry paste","amount":"3 tbsp"},{"name":"onion","amount":"1"},{"name":"garlic","amount":"3 cloves"},{"name":"diced tomatoes","amount":"1 can"}]',
 '["Sauté onion and garlic.","Add curry paste; cook 1 min.","Add sweet potato and tomatoes; cook 5 min.","Pour in coconut milk; simmer 15 min.","Add chickpeas and spinach; cook 5 min.","Serve with rice or naan."]'),
-- 34
('Banana Bread', 'Breakfast', 'American', 'classic',
 '["Baking","Breakfast","Sweet","Meal-Prep"]', 5, 10,
 '[{"name":"overripe bananas","amount":"3"},{"name":"all-purpose flour","amount":"1.5 cups"},{"name":"sugar","amount":"3/4 cup"},{"name":"butter","amount":"1/3 cup melted"},{"name":"egg","amount":"1"},{"name":"vanilla","amount":"1 tsp"},{"name":"baking soda","amount":"1 tsp"},{"name":"salt","amount":"1/4 tsp"}]',
 '["Preheat oven to 350°F (175°C); grease a loaf pan.","Mash bananas; mix with melted butter.","Stir in sugar, egg, vanilla.","Fold in flour, baking soda, salt.","Pour into pan; bake 60 min.","Cool before slicing."]'),
-- 35
('Phở Bò (Beef Pho)', 'Dinner', 'Vietnamese', 'classic',
 '["Soup","Beef","Weekend"]', 5, 6,
 '[{"name":"beef bones","amount":"1kg"},{"name":"beef brisket","amount":"300g"},{"name":"rice noodles","amount":"400g"},{"name":"onion","amount":"1 charred"},{"name":"ginger","amount":"50g charred"},{"name":"star anise","amount":"3"},{"name":"cinnamon","amount":"1 stick"},{"name":"fish sauce","amount":"3 tbsp"},{"name":"bean sprouts","amount":"1 cup"},{"name":"Thai basil","amount":"handful"},{"name":"lime","amount":"1"},{"name":"hoisin sauce","amount":"to serve"}]',
 '["Simmer bones and aromatics 3+ hours.","Strain broth; season with fish sauce.","Cook noodles per package.","Slice brisket thin.","Serve noodles in bowls; ladle hot broth over beef.","Garnish with sprouts, basil, lime."]'),
-- 36
('Mac and Cheese', 'Dinner', 'American', 'classic',
 '["Comfort","Vegetarian","Kids"]', 5, 6,
 '[{"name":"elbow macaroni","amount":"400g"},{"name":"butter","amount":"4 tbsp"},{"name":"all-purpose flour","amount":"1/4 cup"},{"name":"milk","amount":"2 cups"},{"name":"sharp cheddar","amount":"300g"},{"name":"Gruyere","amount":"100g"},{"name":"mustard powder","amount":"1/2 tsp"},{"name":"salt and pepper","amount":"to taste"}]',
 '["Cook pasta; drain.","Make roux with butter and flour.","Whisk in milk until thickened.","Melt in cheeses and mustard.","Stir in pasta; season.","Serve as-is or bake with breadcrumb topping 20 min."]'),
-- 37
('Falafel', 'Lunch', 'Middle Eastern', 'classic',
 '["Vegetarian","Healthy","Meal-Prep"]', 4, 20,
 '[{"name":"dried chickpeas","amount":"250g soaked overnight"},{"name":"onion","amount":"1"},{"name":"garlic","amount":"4 cloves"},{"name":"parsley","amount":"1 cup"},{"name":"cumin","amount":"2 tsp"},{"name":"coriander","amount":"1 tsp"},{"name":"baking powder","amount":"1 tsp"},{"name":"flour","amount":"2 tbsp"},{"name":"salt","amount":"to taste"}]',
 '["Drain chickpeas; blend with onion, garlic, herbs, spices.","Mix in flour and baking powder.","Form small balls.","Fry in oil at 350°F (175°C) 3–4 min until golden.","Serve in pita with tahini and vegetables."]'),
-- 38
('Quiche Lorraine', 'Breakfast', 'French', 'classic',
 '["Baking","Breakfast","Weekend"]', 4, 8,
 '[{"name":"pie crust","amount":"1 blind-baked"},{"name":"bacon lardons","amount":"150g"},{"name":"eggs","amount":"4"},{"name":"heavy cream","amount":"300ml"},{"name":"Gruyere cheese","amount":"100g"},{"name":"nutmeg","amount":"pinch"},{"name":"salt and pepper","amount":"to taste"}]',
 '["Preheat oven to 375°F (190°C).","Cook bacon until crisp.","Whisk eggs, cream, nutmeg, salt, pepper.","Scatter bacon and cheese in crust.","Pour custard over.","Bake 30–35 min until set.","Rest 10 min before slicing."]'),
-- 39
('Gazpacho', 'Lunch', 'Spanish', 'classic',
 '["Soup","Vegetarian","No-Cook","Summer"]', 4, 6,
 '[{"name":"ripe tomatoes","amount":"1kg"},{"name":"cucumber","amount":"1"},{"name":"red bell pepper","amount":"1"},{"name":"garlic","amount":"2 cloves"},{"name":"red wine vinegar","amount":"2 tbsp"},{"name":"olive oil","amount":"4 tbsp"},{"name":"stale bread","amount":"2 slices"},{"name":"salt","amount":"to taste"}]',
 '["Soak bread in water; squeeze dry.","Blend all ingredients until very smooth.","Season generously.","Chill at least 2 hours.","Serve cold with diced garnish."]'),
-- 40
('Korean Bibimbap', 'Dinner', 'Korean', 'classic',
 '["Rice","Healthy","Vegetarian-option"]', 5, 4,
 '[{"name":"cooked short-grain rice","amount":"3 cups"},{"name":"ground beef or tofu","amount":"200g"},{"name":"spinach","amount":"2 cups"},{"name":"carrot","amount":"1"},{"name":"zucchini","amount":"1"},{"name":"shiitake mushrooms","amount":"100g"},{"name":"fried egg","amount":"4"},{"name":"gochujang","amount":"4 tbsp"},{"name":"sesame oil","amount":"2 tbsp"},{"name":"soy sauce","amount":"2 tbsp"}]',
 '["Sauté each vegetable separately with sesame oil.","Brown and season beef with soy sauce.","Divide rice into bowls.","Arrange vegetables and beef on top.","Place fried egg on top.","Add gochujang; mix before eating."]'),
-- 41
('Beef Stroganoff', 'Dinner', 'Russian', 'classic',
 '["Beef","Comfort","Pasta"]', 4, 4,
 '[{"name":"beef sirloin","amount":"500g"},{"name":"mushrooms","amount":"250g"},{"name":"onion","amount":"1"},{"name":"garlic","amount":"2 cloves"},{"name":"beef broth","amount":"1 cup"},{"name":"sour cream","amount":"200ml"},{"name":"Dijon mustard","amount":"1 tsp"},{"name":"egg noodles","amount":"300g"}]',
 '["Slice beef thin; brown in batches.","Sauté onion, garlic, mushrooms.","Add broth; simmer 5 min.","Reduce heat; stir in sour cream and mustard.","Return beef; simmer 2 min — do not boil.","Serve over cooked egg noodles."]'),
-- 42
('Lamb Gyros', 'Lunch', 'Greek', 'classic',
 '["Lamb","Street Food","Weekend"]', 5, 6,
 '[{"name":"ground lamb","amount":"700g"},{"name":"pita bread","amount":"6"},{"name":"garlic","amount":"3 cloves"},{"name":"cumin","amount":"1 tsp"},{"name":"oregano","amount":"1 tsp"},{"name":"tzatziki","amount":"1 cup"},{"name":"tomato","amount":"2"},{"name":"red onion","amount":"1"},{"name":"lettuce","amount":"1 cup"}]',
 '["Mix lamb with garlic and spices; form into a loaf or patties.","Bake at 350°F (175°C) 40 min or grill patties.","Slice thin.","Warm pitas.","Assemble with lamb, tzatziki, tomato, onion, lettuce."]'),
-- 43
('Pumpkin Soup', 'Lunch', 'Australian', 'classic',
 '["Soup","Vegetarian","Autumn"]', 4, 6,
 '[{"name":"pumpkin","amount":"1kg peeled"},{"name":"onion","amount":"1"},{"name":"garlic","amount":"3 cloves"},{"name":"vegetable broth","amount":"4 cups"},{"name":"coconut milk","amount":"200ml"},{"name":"ginger","amount":"1 tsp"},{"name":"nutmeg","amount":"1/4 tsp"},{"name":"olive oil","amount":"2 tbsp"}]',
 '["Roast pumpkin at 400°F (200°C) 30 min.","Sauté onion, garlic, ginger.","Add roasted pumpkin and broth; simmer 10 min.","Blend until smooth.","Stir in coconut milk; season.","Serve with crusty bread."]'),
-- 44
('Churros with Chocolate Sauce', 'Dessert', 'Spanish', 'classic',
 '["Dessert","Sweet","Fried"]', 5, 4,
 '[{"name":"water","amount":"1 cup"},{"name":"butter","amount":"2 tbsp"},{"name":"salt","amount":"1/2 tsp"},{"name":"all-purpose flour","amount":"1 cup"},{"name":"eggs","amount":"3"},{"name":"cinnamon sugar","amount":"1/2 cup"},{"name":"dark chocolate","amount":"100g"},{"name":"heavy cream","amount":"100ml"}]',
 '["Boil water with butter and salt.","Stir in flour until dough forms.","Cool; beat in eggs one at a time.","Pipe into hot oil; fry 3 min each side.","Roll in cinnamon sugar.","Melt chocolate with cream for sauce.","Serve warm."]'),
-- 45
('Tom Kha Gai', 'Dinner', 'Thai', 'classic',
 '["Soup","Chicken","Mild"]', 5, 4,
 '[{"name":"chicken breast","amount":"300g"},{"name":"coconut milk","amount":"400ml"},{"name":"chicken broth","amount":"2 cups"},{"name":"galangal","amount":"30g"},{"name":"lemongrass","amount":"2 stalks"},{"name":"kaffir lime leaves","amount":"4"},{"name":"mushrooms","amount":"150g"},{"name":"fish sauce","amount":"2 tbsp"},{"name":"lime juice","amount":"2 tbsp"},{"name":"Thai chilies","amount":"2"}]',
 '["Simmer broth with galangal, lemongrass, lime leaves 5 min.","Add coconut milk and chicken; simmer 10 min.","Add mushrooms and chilies; cook 5 min.","Season with fish sauce and lime juice.","Serve hot; do not eat the aromatics."]'),
-- 46
('Spinach and Ricotta Stuffed Shells', 'Dinner', 'Italian-American', 'classic',
 '["Pasta","Vegetarian","Comfort"]', 4, 6,
 '[{"name":"jumbo pasta shells","amount":"250g"},{"name":"ricotta","amount":"500g"},{"name":"frozen spinach","amount":"300g thawed"},{"name":"egg","amount":"1"},{"name":"parmesan","amount":"60g"},{"name":"mozzarella","amount":"150g"},{"name":"Italian seasoning","amount":"1 tsp"},{"name":"marinara sauce","amount":"2 cups"}]',
 '["Cook shells; drain.","Mix ricotta, squeezed spinach, egg, parmesan, seasoning.","Fill shells.","Spread marinara in baking dish; arrange shells.","Top with mozzarella.","Bake at 375°F (190°C) 30 min covered, 10 min uncovered."]'),
-- 47
('Fried Rice', 'Dinner', 'Chinese', 'classic',
 '["Rice","Quick","Meal-Prep","Leftover-Friendly"]', 4, 4,
 '[{"name":"cooked cold rice","amount":"3 cups"},{"name":"eggs","amount":"3"},{"name":"frozen peas and carrots","amount":"1 cup"},{"name":"soy sauce","amount":"3 tbsp"},{"name":"sesame oil","amount":"1 tsp"},{"name":"green onions","amount":"3"},{"name":"garlic","amount":"2 cloves"},{"name":"oil","amount":"2 tbsp"}]',
 '["Heat wok; scramble eggs; set aside.","Stir-fry garlic and vegetables.","Add rice; press and toss until heated.","Add soy sauce and sesame oil.","Return eggs; toss with green onions."]'),
-- 48
('Bruschetta', 'Snack', 'Italian', 'classic',
 '["Snack","Vegetarian","Quick","Appetizer"]', 4, 6,
 '[{"name":"baguette","amount":"1"},{"name":"ripe tomatoes","amount":"4"},{"name":"garlic","amount":"2 cloves"},{"name":"fresh basil","amount":"1/4 cup"},{"name":"olive oil","amount":"3 tbsp"},{"name":"balsamic vinegar","amount":"1 tbsp"},{"name":"salt","amount":"to taste"}]',
 '["Dice tomatoes; mix with basil, oil, vinegar, salt.","Slice baguette; toast under broiler.","Rub hot bread with cut garlic.","Spoon tomato mixture on top.","Serve immediately."]'),
-- 49
('Lentil Dal', 'Dinner', 'Indian', 'classic',
 '["Vegetarian","Healthy","Budget","Meal-Prep"]', 4, 6,
 '[{"name":"red lentils","amount":"1.5 cups"},{"name":"onion","amount":"1"},{"name":"garlic","amount":"4 cloves"},{"name":"ginger","amount":"1 tbsp"},{"name":"diced tomatoes","amount":"1 can"},{"name":"coconut milk","amount":"200ml"},{"name":"turmeric","amount":"1 tsp"},{"name":"cumin seeds","amount":"1 tsp"},{"name":"garam masala","amount":"1 tsp"},{"name":"spinach","amount":"2 cups optional"}]',
 '["Fry cumin seeds in oil until popping.","Add onion, garlic, ginger; sauté until golden.","Add spices; cook 1 min.","Add tomatoes and lentils; pour in water to cover.","Simmer 20 min until lentils break down.","Stir in coconut milk and spinach.","Serve with rice or naan."]'),
-- 50
('Apple Crumble', 'Dessert', 'British', 'classic',
 '["Baking","Dessert","Autumn","Comfort"]', 5, 6,
 '[{"name":"apples","amount":"6 large"},{"name":"brown sugar","amount":"1/4 cup"},{"name":"cinnamon","amount":"1 tsp"},{"name":"lemon juice","amount":"1 tbsp"},{"name":"all-purpose flour","amount":"1 cup"},{"name":"rolled oats","amount":"1/2 cup"},{"name":"butter","amount":"100g cold"},{"name":"sugar","amount":"1/2 cup"}]',
 '["Preheat oven to 375°F (190°C).","Peel and slice apples; toss with brown sugar, cinnamon, lemon juice.","Spread in baking dish.","Rub butter into flour, oats, sugar until crumbly.","Spread topping over apples.","Bake 35–40 min until golden.","Serve with cream or ice cream."]');

-- Insert only rows not already present (match on Name)
INSERT INTO [dbo].[Recipes] (Name, Course, Cuisine, Source, TagsJson, Rating, Servings, IngredientsJson, StepsJson)
SELECT r.Name, r.Course, r.Cuisine, r.Source, r.TagsJson, r.Rating, r.Servings, r.IngredientsJson, r.StepsJson
FROM @recipes r
WHERE NOT EXISTS (
    SELECT 1 FROM [dbo].[Recipes] e WHERE e.Name = r.Name
);

SELECT @@ROWCOUNT AS RecipesInserted;
