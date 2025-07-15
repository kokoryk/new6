export interface KoreanFoodData {
  nameKorean: string;
  nameEnglish: string;
  description: string;
  calories: number;
  imageUrl?: string;
}

export const koreanFoodDatabase: Record<string, KoreanFoodData> = {
  "비빔밥": {
    nameKorean: "비빔밥",
    nameEnglish: "Bibimbap",
    description: "A signature Korean dish featuring steamed rice topped with an assortment of seasoned vegetables, marinated meat, and a fried egg, served with spicy gochujang sauce.",
    calories: 420,
    imageUrl: "https://images.unsplash.com/photo-1553163147-622ab57be1c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300"
  },
  "김치찌개": {
    nameKorean: "김치찌개",
    nameEnglish: "Kimchi Jjigae",
    description: "A hearty and spicy Korean stew made with aged kimchi, tofu, pork, and vegetables. This comfort food is perfect for cold days and is rich in probiotics.",
    calories: 280,
    imageUrl: "https://images.unsplash.com/photo-1582049176995-29297d1b1d30?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300"
  },
  "불고기": {
    nameKorean: "불고기",
    nameEnglish: "Bulgogi",
    description: "Thinly sliced beef marinated in a sweet and savory sauce of soy sauce, sugar, sesame oil, garlic, and pear. Grilled to perfection and often wrapped in lettuce leaves.",
    calories: 350,
    imageUrl: "https://images.unsplash.com/photo-1544885935-98dd03b09034?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300"
  },
  "떡볶이": {
    nameKorean: "떡볶이",
    nameEnglish: "Tteokbokki",
    description: "Chewy rice cakes simmered in a sweet and spicy sauce made from gochujang. A popular Korean street food often enjoyed with fish cakes and boiled eggs.",
    calories: 180,
    imageUrl: "https://images.unsplash.com/photo-1580655653885-65763b2597d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300"
  },
  "잡채": {
    nameKorean: "잡채",
    nameEnglish: "Japchae",
    description: "Sweet potato starch noodles stir-fried with colorful vegetables and beef, seasoned with soy sauce and sesame oil. A festive dish often served at celebrations.",
    calories: 290,
    imageUrl: "https://images.unsplash.com/photo-1589300876540-849dc854c1f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300"
  },
  "순두부찌개": {
    nameKorean: "순두부찌개",
    nameEnglish: "Sundubu Jjigae",
    description: "A comforting Korean stew featuring silky soft tofu in a spicy, savory broth with vegetables and your choice of seafood or meat. Served bubbling hot.",
    calories: 190,
    imageUrl: "https://images.unsplash.com/photo-1596797038530-2c107229654b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300"
  },
  "갈비": {
    nameKorean: "갈비",
    nameEnglish: "Galbi",
    description: "Korean BBQ short ribs marinated in a sweet soy-based sauce. Grilled to caramelized perfection and served with lettuce wraps and banchan.",
    calories: 450,
    imageUrl: "https://images.unsplash.com/photo-1555975513-a9db79b45616?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300"
  },
  "냉면": {
    nameKorean: "냉면",
    nameEnglish: "Naengmyeon",
    description: "Cold buckwheat noodles served in a refreshing broth or with spicy sauce. Perfect for hot summer days and often garnished with pickled radish and egg.",
    calories: 320,
    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300"
  },
  "삼겹살": {
    nameKorean: "삼겹살",
    nameEnglish: "Samgyeopsal",
    description: "Thick slices of pork belly grilled at the table. Traditionally wrapped in lettuce with garlic, green onions, and ssamjang (fermented bean paste).",
    calories: 520,
    imageUrl: "https://images.unsplash.com/photo-1555975513-a9db79b45616?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300"
  },
  "된장찌개": {
    nameKorean: "된장찌개",
    nameEnglish: "Doenjang Jjigae",
    description: "A savory soybean paste stew with tofu, vegetables, and sometimes seafood or meat. A staple Korean comfort food rich in umami flavors.",
    calories: 220,
    imageUrl: "https://images.unsplash.com/photo-1582049176995-29297d1b1d30?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300"
  },
  "제육볶음": {
    nameKorean: "제육볶음",
    nameEnglish: "Jeyuk Bokkeum",
    description: "Spicy stir-fried pork with vegetables in a savory-sweet gochujang sauce. Often served with rice and lettuce wraps.",
    calories: 380
  },
  "치킨": {
    nameKorean: "치킨",
    nameEnglish: "Korean Fried Chicken",
    description: "Crispy double-fried chicken with various sauces like soy garlic, spicy, or honey butter. A popular Korean dish.",
    calories: 450
  },
  "라면": {
    nameKorean: "라면",
    nameEnglish: "Ramyeon",
    description: "Korean instant noodles in spicy broth, often topped with vegetables, egg, and sometimes meat.",
    calories: 290
  },
  "국수": {
    nameKorean: "국수",
    nameEnglish: "Guksu",
    description: "Korean noodle soup served in clear or seasoned broth with various toppings.",
    calories: 250
  },
  "돼지고기": {
    nameKorean: "돼지고기",
    nameEnglish: "Pork",
    description: "Korean-style pork dish, commonly grilled or stir-fried with various seasonings.",
    calories: 400
  },
  "소고기": {
    nameKorean: "소고기",
    nameEnglish: "Beef",
    description: "Korean-style beef dish, often marinated and grilled or used in stews.",
    calories: 350
  },
  "닭고기": {
    nameKorean: "닭고기",
    nameEnglish: "Chicken",
    description: "Korean-style chicken dish, prepared in various ways including grilled, fried, or braised.",
    calories: 300
  },
  "밥": {
    nameKorean: "밥",
    nameEnglish: "Rice",
    description: "Steamed white rice, the staple grain in Korean cuisine.",
    calories: 200
  },
  "김치": {
    nameKorean: "김치",
    nameEnglish: "Kimchi",
    description: "Fermented cabbage with chili peppers, garlic, and other seasonings. Korea's most famous side dish.",
    calories: 30
  },
  "낙지볶음": {
    nameKorean: "낙지볶음",
    nameEnglish: "Nakji Bokkeum",
    description: "Spicy stir-fried octopus with vegetables in a fiery gochujang sauce. A popular Korean dish known for its chewy texture and intense flavor.",
    calories: 220
  },
  "오징어볶음": {
    nameKorean: "오징어볶음",
    nameEnglish: "Ojingeo Bokkeum",
    description: "Spicy stir-fried squid with vegetables and Korean chili paste. A flavorful seafood dish with a tender, chewy texture.",
    calories: 180
  },
  "청국장": {
    nameKorean: "청국장",
    nameEnglish: "Cheonggukjang",
    description: "A rich, fermented soybean stew with a strong aroma and deep umami flavor. Often served with tofu and vegetables.",
    calories: 240
  },
  "무대찌개": {
    nameKorean: "무대찌개",
    nameEnglish: "Mudae Jjigae",
    description: "A hearty Korean stew with radish and other vegetables in a savory broth. A comforting home-style dish.",
    calories: 160
  },
  "돌솥비빔밥": {
    nameKorean: "돌솥비빔밥",
    nameEnglish: "Dolsot Bibimbap",
    description: "Bibimbap served in a hot stone bowl that creates a crispy rice crust. Mixed vegetables, meat, and egg with spicy gochujang sauce.",
    calories: 480
  },
  "갈비탕": {
    nameKorean: "갈비탕",
    nameEnglish: "Galbitang",
    description: "Clear beef short rib soup with tender meat and vegetables. A nourishing and comforting Korean soup.",
    calories: 320
  },
  "삼계탕": {
    nameKorean: "삼계탕",
    nameEnglish: "Samgyetang",
    description: "Whole young chicken stuffed with ginseng, rice, and herbs, served in a clear broth. A traditional health food.",
    calories: 400
  },
  "해물찜": {
    nameKorean: "해물찜",
    nameEnglish: "Haemul Jjim",
    description: "Spicy steamed seafood with vegetables in a savory sauce. A popular sharing dish with various seafood.",
    calories: 280
  },
  "파전": {
    nameKorean: "파전",
    nameEnglish: "Pajeon",
    description: "Korean scallion pancake with a crispy exterior and chewy interior. Often enjoyed with makgeolli rice wine.",
    calories: 250
  },
  "막국수": {
    nameKorean: "막국수",
    nameEnglish: "Makguksu",
    description: "Cold buckwheat noodles in a tangy, spicy sauce. A refreshing dish popular in summer and mountainous regions.",
    calories: 340
  }
};

export function findKoreanFood(koreanName: string): KoreanFoodData | undefined {
  return koreanFoodDatabase[koreanName];
}

export function getAllKoreanFoods(): KoreanFoodData[] {
  return Object.values(koreanFoodDatabase);
}
