from typing import List, Dict, Any, Optional
import pandas as pd
from services.excel_service import ExcelService
from services.logger_service import LoggerService
from models.product_model import Product, ProductCategory


class ExcelViewModel:
    def __init__(self):
        self.excel_service = ExcelService()
        self.logger = LoggerService()
        self.current_df: Optional[pd.DataFrame] = None

    def import_file(self, filepath: str) -> Dict[str, Any]:
        try:
            df = self.excel_service.import_excel(filepath)
            self.current_df = df
            validation = self.excel_service.validate_structure(df)
            info = self.excel_service.get_excel_info(filepath)

            return {
                "success": True,
                "validation": validation,
                "info": info,
                "preview": df.head(20).to_dict(orient="records")
            }
        except Exception as e:
            self.logger.error(f"Excel import error: {e}")
            return {"success": False, "error": str(e)}

    def export_products(self, products: List[Product], filepath: str) -> bool:
        try:
            data = [
                {
                    "شناسه": p.id,
                    "نام محصول": p.name,
                    "قیمت": p.price,
                    "قیمت تخفیف": p.discount_price or "",
                    "دسته‌بندی": p.category.value,
                    "موجودی": p.stock,
                    "رنگ‌ها": "، ".join(p.colors),
                    "سایزها": "، ".join(p.sizes),
                    "جنس": p.material,
                    "اطلاعات ارسال": p.shipping_info,
                    "فعال": "بله" if p.is_active else "خیر"
                }
                for p in products
            ]
            return self.excel_service.export_to_excel(data, filepath)
        except Exception as e:
            self.logger.error(f"Excel export error: {e}")
            return False

    def preview_data(self, rows: int = 20) -> List[Dict[str, Any]]:
        if self.current_df is None:
            return []
        return self.current_df.head(rows).to_dict(orient="records")

    def get_column_mapping(self) -> Dict[str, str]:
        return {
            "نام محصول": "name",
            "قیمت": "price",
            "قیمت تخفیف": "discount_price",
            "موجودی": "stock",
            "دسته‌بندی": "category",
            "رنگ‌ها": "colors",
            "سایزها": "sizes",
            "جنس": "material",
            "اطلاعات ارسال": "shipping_info",
            "توضیحات": "description"
        }

    def convert_to_products(self, df: pd.DataFrame) -> List[Product]:
        mapping = self.get_column_mapping()
        products = []

        for idx, row in df.iterrows():
            try:
                product = Product(
                    id=str(idx + 1),
                    name=str(row.get("نام محصول", "")),
                    price=float(row.get("قیمت", 0) or 0),
                    discount_price=float(row["قیمت تخفیف"]) if row.get("قیمت تخفیف") else None,
                    category=ProductCategory(str(row.get("دسته‌بندی", "سایر"))),
                    stock=int(row.get("موجودی", 0) or 0),
                    colors=self._parse_list(row.get("رنگ‌ها", "")),
                    sizes=self._parse_list(row.get("سایزها", "")),
                    material=str(row.get("جنس", "")),
                    shipping_info=str(row.get("اطلاعات ارسال", "")),
                    description=str(row.get("توضیحات", ""))
                )
                products.append(product)
            except Exception as e:
                self.logger.warning(f"Row {idx} conversion error: {e}")

        return products

    def _parse_list(self, value: Any) -> list:
        if not value:
            return []
        if isinstance(value, list):
            return value
        return [x.strip() for x in str(value).split("،")]
