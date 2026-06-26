from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime
from enum import Enum


class ProductCategory(Enum):
    CLOTHING = "پوشاک"
    ELECTRONICS = "الکترونیک"
    HOME = "خانه و آشپزخانه"
    SPORTS = "ورزشی"
    BOOKS = "کتاب و لوازم تحریر"
    BAGS = "کیف و کفش"
    ACCESSORIES = "اکسسوری"
    OTHER = "سایر"


@dataclass
class Product:
    id: str
    name: str
    description: str = ""
    price: float = 0.0
    discount_price: Optional[float] = None
    category: ProductCategory = ProductCategory.OTHER
    stock: int = 0
    colors: List[str] = field(default_factory=list)
    sizes: List[str] = field(default_factory=list)
    material: str = ""
    shipping_info: str = ""
    images: List[str] = field(default_factory=list)
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "price": self.price,
            "discount_price": self.discount_price,
            "category": self.category.value,
            "stock": self.stock,
            "colors": self.colors,
            "sizes": self.sizes,
            "material": self.material,
            "shipping_info": self.shipping_info,
            "images": self.images,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Product':
        return cls(
            id=data.get("id", ""),
            name=data.get("name", ""),
            description=data.get("description", ""),
            price=float(data.get("price", 0)),
            discount_price=float(data["discount_price"]) if data.get("discount_price") else None,
            category=ProductCategory(data.get("category", "سایر")),
            stock=int(data.get("stock", 0)),
            colors=data.get("colors", []),
            sizes=data.get("sizes", []),
            material=data.get("material", ""),
            shipping_info=data.get("shipping_info", ""),
            images=data.get("images", []),
            is_active=data.get("is_active", True)
        )

    def get_discount_percent(self) -> Optional[int]:
        if self.discount_price and self.price > 0:
            return int((1 - self.discount_price / self.price) * 100)
        return None

    def is_in_stock(self) -> bool:
        return self.stock > 0 and self.is_active
