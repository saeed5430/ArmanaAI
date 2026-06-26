import json
import os
from typing import List, Optional
from datetime import datetime
from models.product_model import Product, ProductCategory
from services.logger_service import LoggerService


class ProductViewModel:
    def __init__(self):
        self.logger = LoggerService()
        self.products: List[Product] = []
        self._data_file = self._find_data_file()

    def _find_data_file(self) -> str:
        for p in ["persian_ai_panel/data/products.json", "data/products.json"]:
            if os.path.exists(p):
                return p
        os.makedirs("persian_ai_panel/data", exist_ok=True)
        return "persian_ai_panel/data/products.json"

    def load_products(self) -> List[Product]:
        try:
            if os.path.exists(self._data_file):
                with open(self._data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                self.products = [Product.from_dict(item) for item in data]
            else:
                self.products = self._get_default_products()
                self.save_products()
        except Exception as e:
            self.logger.error(f"Error loading products: {e}")
            self.products = []
        return self.products

    def _get_default_products(self) -> List[Product]:
        return [
            Product(id="1", name="شال ابریشم آبی", price=158000, stock=12,
                    category=ProductCategory.CLOTHING, colors=["آبی", "سفید", "مشکی"],
                    material="ابریشم", shipping_info="3 روز کاری"),
            Product(id="2", name="مانتو کتان مشکی", price=450000, stock=8,
                    category=ProductCategory.CLOTHING, colors=["مشکی", "سرمه‌ای", "طوسی"],
                    material="کتان", shipping_info="5 روز کاری"),
            Product(id="3", name="کیف چرم دستی", price=520000, stock=5,
                    category=ProductCategory.BAGS, colors=["مشکی", "قهوه‌ای", "کرم"],
                    material="چرم طبیعی", shipping_info="5 روز کاری"),
        ]

    def save_products(self) -> bool:
        try:
            with open(self._data_file, 'w', encoding='utf-8') as f:
                json.dump([p.to_dict() for p in self.products],
                          f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            self.logger.error(f"Error saving products: {e}")
            return False

    def add_product(self, product: Product) -> bool:
        product.id = str(int(self.products[-1].id) + 1) if self.products else "1"
        product.created_at = datetime.now()
        product.updated_at = datetime.now()
        self.products.append(product)
        return self.save_products()

    def update_product(self, product: Product) -> bool:
        for i, p in enumerate(self.products):
            if p.id == product.id:
                product.updated_at = datetime.now()
                self.products[i] = product
                return self.save_products()
        return False

    def delete_product(self, product_id: str) -> bool:
        self.products = [p for p in self.products if p.id != product_id]
        return self.save_products()

    def get_product_by_id(self, product_id: str) -> Optional[Product]:
        for p in self.products:
            if p.id == product_id:
                return p
        return None

    def search_products(self, query: str) -> List[Product]:
        q = query.lower().strip()
        if not q:
            return self.products
        return [
            p for p in self.products
            if q in p.name.lower()
            or q in p.description.lower()
            or q in p.category.value.lower()
        ]

    def get_products_by_category(self, category: ProductCategory) -> List[Product]:
        return [p for p in self.products if p.category == category]

    def get_statistics(self) -> dict:
        total = len(self.products)
        active = sum(1 for p in self.products if p.is_active)
        out_of_stock = sum(1 for p in self.products if p.stock == 0)
        total_value = sum(p.price * p.stock for p in self.products if p.is_active)

        return {
            "total": total,
            "active": active,
            "out_of_stock": out_of_stock,
            "total_value": total_value,
            "categories": len(set(p.category for p in self.products))
        }
