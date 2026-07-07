import psycopg2
import os
from dotenv import load_dotenv
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Supabase PostgreSQL Database connection string/URI
# Format: postgresql://postgres.[your-project-id]:[your-password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
DB_URL = os.getenv("DATABASE_URL")

def get_connection():
    try:
        # Pass the database connection URL directly into psycopg2
        conn = psycopg2.connect(DB_URL)
        return conn
    except Exception as e:
        logger.error(f"Supabase DB Connection Error: {e}")
        return None

# ================= AUTHENTICATION & SINGLE ROLE VERIFICATION =================
def verify_staff_credentials(staff_id, password, expected_role):
    conn = get_connection()
    if not conn:
        return {"auth": False, "message": "Database connection unavailable."}
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT PASSWORD FROM STAFF WHERE STAFF_ID = %s", [int(staff_id)])
        row = cursor.fetchone()
        if not row or str(row[0]) != str(password):
            return {"auth": False, "message": "Invalid Staff ID or Password configuration."}
        
        table_map = {"manager": "MANAGER", "chef": "CHEF", "delivery": "DELIVERYSTAFF"}
        target_table = table_map.get(expected_role)
        
        cursor.execute(f"SELECT COUNT(*) FROM {target_table} WHERE STAFF_ID = %s", [int(staff_id)])
        if cursor.fetchone()[0] == 0:
            return {"auth": False, "message": f"Access Denied: Worker profile does not exist inside {expected_role} subtable structure."}
            
        return {"auth": True}
    except Exception as e:
        return {"auth": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()

def check_existing_role(cursor, staff_id):
    cursor.execute("SELECT COUNT(*) FROM MANAGER WHERE STAFF_ID = %s", [staff_id])
    if cursor.fetchone()[0] > 0:
        return "Manager"
    
    cursor.execute("SELECT COUNT(*) FROM CHEF WHERE STAFF_ID = %s", [staff_id])
    if cursor.fetchone()[0] > 0:
        return "Chef"
        
    cursor.execute("SELECT COUNT(*) FROM DELIVERYSTAFF WHERE STAFF_ID = %s", [staff_id])
    if cursor.fetchone()[0] > 0:
        return "Delivery Staff"
        
    return None

# ================= MENU ITEMS WITH UNIT =================
def get_menu_items():
    conn = get_connection()
    if not conn: return []
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT ITEM_ID, ITEM_NAME, ITEM_PRICE, CATEGORY, PICTURES_URL, SERVING_UNIT, SERVING_SIZE
            FROM MENUITEM
            ORDER BY ITEM_ID
        """)
        data = []
        for row in cursor.fetchall():
            data.append({
                "id": row[0],
                "name": row[1],
                "price": float(row[2]) if row[2] else 0.0,
                "category": row[3],
                "pictures_url": row[4] if row[4] else "",
                "unit": row[5] if row[5] else "pcs",
                "serving_size": row[6] if row[6] else 1
            })
        return data
    except Exception as e:
        logger.error(f"Menu fetch error: {e}")
        return []
    finally:
        cursor.close()
        conn.close()

def add_menu_item(name, price, category, staff_id, serving_size, serving_unit, pictures_url):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COALESCE(MAX(ITEM_ID), 0) + 1 FROM MENUITEM")
        new_id = cursor.fetchone()[0]
        cursor.execute("""
            INSERT INTO MENUITEM
            (ITEM_ID, ITEM_NAME, ITEM_PRICE, CATEGORY, STAFF_ID, SERVING_SIZE, SERVING_UNIT, PICTURES_URL)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (new_id, name, float(price), category, staff_id, serving_size, serving_unit, pictures_url))
        conn.commit()
        return {"success": True, "id": new_id}
    except Exception as e:
        conn.rollback()
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()

def update_menu_item(item_id, name, price, category, unit, serving_size, pictures_url):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE MENUITEM
            SET ITEM_NAME = %s,
                ITEM_PRICE = %s,
                CATEGORY = %s,
                SERVING_UNIT = %s,
                SERVING_SIZE = %s,
                PICTURES_URL = %s
            WHERE ITEM_ID = %s
        """, (name, float(price), category, unit, float(serving_size), pictures_url, item_id))
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()

def delete_menu_item(item_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM MENUDEALCONTAINSMENUITEMS WHERE ITEM_ID = %s", [item_id])
        cursor.execute("DELETE FROM ORDERCONTAINSMENUITEMS WHERE ITEM_ID = %s", [item_id])
        cursor.execute("DELETE FROM MENUITEM WHERE ITEM_ID = %s", [item_id])
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()

# ================= BASE MENU DEALS =================
def get_base_deals():
    conn = get_connection()
    if not conn: return []
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT DEAL_ID, DEAL_NAME, PICTURES_URL
            FROM MENUDEAL
            ORDER BY DEAL_ID
        """)
        data = []
        for row in cursor.fetchall():
            data.append({
                "deal_id": row[0],
                "deal_name": row[1] if row[1] else "",
                "pictures_url": row[2] if row[2] else ""
            })
        return data
    except Exception as e:
        logger.error(f"Base deals fetch error: {e}")
        return []
    finally:
        cursor.close()
        conn.close()

def add_base_deal(name, pictures_url, staff_id=7):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COALESCE(MAX(DEAL_ID), 0) + 1 FROM MENUDEAL")
        new_id = cursor.fetchone()[0]
        cursor.execute("""
            INSERT INTO MENUDEAL (DEAL_ID, DEAL_NAME, STAFF_ID, PICTURES_URL)
            VALUES (%s, %s, %s, %s)
        """, (new_id, name, staff_id, pictures_url))
        conn.commit()
        return {"success": True, "deal_id": new_id}
    except Exception as e:
        conn.rollback()
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()

def update_base_deal(deal_id, name, pictures_url):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE MENUDEAL
            SET DEAL_NAME = %s,
                PICTURES_URL = %s
            WHERE DEAL_ID = %s
        """, (name, pictures_url, int(deal_id)))
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()

def delete_base_deal(deal_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM ORDERCONTAINSMENUDEALS WHERE DEAL_ID = %s", [int(deal_id)])
        cursor.execute("DELETE FROM MENUDEALCONTAINSMENUITEMS WHERE DEAL_ID = %s", [int(deal_id)])
        cursor.execute("DELETE FROM MENUDEAL WHERE DEAL_ID = %s", [int(deal_id)])
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()

# ================= MENU DEALS JUNCTION =================
def get_deal_items_junction():
    conn = get_connection()
    if not conn: return []
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT DEAL_ID, ITEM_ID, QUANTITY, UNIT FROM MENUDEALCONTAINSMENUITEMS ORDER BY DEAL_ID, ITEM_ID")
        data = []
        for row in cursor.fetchall():
            data.append({"deal_id": row[0], "item_id": row[1], "quantity": row[2], "unit": row[3] if row[3] else ""})
        return data
    except Exception as e:
        return []
    finally:
        cursor.close()
        conn.close()

def add_deal_item_junction(deal_id, item_id, quantity, unit):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        deal_id = int(deal_id)
        item_id = int(item_id)
        quantity = float(quantity)
        
        cursor.execute("SELECT COUNT(*) FROM MENUDEAL WHERE DEAL_ID = %s", [deal_id])
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO MENUDEAL (DEAL_ID, DEAL_NAME, STAFF_ID) VALUES (%s, %s, 7)", (deal_id, f"Deal #{deal_id}"))
        cursor.execute("""
            INSERT INTO MENUDEALCONTAINSMENUITEMS (DEAL_ID, ITEM_ID, QUANTITY, UNIT) VALUES (%s, %s, %s, %s)
        """, (deal_id, item_id, quantity, unit))
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()

def update_deal_item_junction(deal_id, item_id, quantity, unit):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE MENUDEALCONTAINSMENUITEMS SET QUANTITY = %s, UNIT = %s WHERE DEAL_ID = %s AND ITEM_ID = %s
        """, (quantity, unit, deal_id, item_id))
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()

def delete_deal_item_junction(deal_id, item_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM MENUDEALCONTAINSMENUITEMS WHERE DEAL_ID = %s AND ITEM_ID = %s", (deal_id, item_id))
        cursor.execute("SELECT COUNT(*) FROM MENUDEALCONTAINSMENUITEMS WHERE DEAL_ID = %s", [deal_id])
        deal_deleted = False
        if cursor.fetchone()[0] == 0:
            cursor.execute("DELETE FROM ORDERCONTAINSMENUDEALS WHERE DEAL_ID = %s", [deal_id])
            cursor.execute("DELETE FROM MENUDEAL WHERE DEAL_ID = %s", [deal_id])
            deal_deleted = True
        conn.commit()
        return {"success": True, "deal_deleted": deal_deleted}
    except Exception as e:
        conn.rollback()
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()

# ================= STAFF MANAGEMENT =================
def get_staff_data():
    conn = get_connection()
    if not conn: return []
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.STAFF_ID, s.STAFF_NAME, s.SALARY,
                   (SELECT COUNT(*) FROM MANAGER m WHERE m.STAFF_ID = s.STAFF_ID) as is_manager,
                   (SELECT COUNT(*) FROM CHEF c WHERE c.STAFF_ID = s.STAFF_ID) as is_chef,
                   (SELECT COUNT(*) FROM DELIVERYSTAFF d WHERE d.STAFF_ID = s.STAFF_ID) as is_delivery,
                   s.PASSWORD
            FROM STAFF s
            ORDER BY s.STAFF_ID
        """)
        data = []
        for row in cursor.fetchall():
            data.append({
                "id": row[0],
                "name": row[1],
                "salary": float(row[2]) if row[2] else 0.0,
                "is_manager": row[3] > 0,
                "is_chef": row[4] > 0,
                "is_delivery": row[5] > 0,
                "password": row[6] if row[6] else ""
            })
        return data
    except Exception as e:
        logger.error(f"Staff data select error: {e}")
        return []
    finally:
        cursor.close()
        conn.close()

def add_staff_comprehensive(name, salary, role_type, password):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COALESCE(MAX(STAFF_ID), 0) + 1 FROM STAFF")
        new_id = cursor.fetchone()[0]
        
        cursor.execute("""
            INSERT INTO STAFF (STAFF_ID, STAFF_NAME, SALARY, PASSWORD) VALUES (%s, %s, %s, %s)
        """, (new_id, name, float(salary if salary else 0), password))
        
        if role_type == "manager":
            cursor.execute("INSERT INTO MANAGER (STAFF_ID) VALUES (%s)", [new_id])
        elif role_type == "chef":
            cursor.execute("INSERT INTO CHEF (STAFF_ID, CHEF_TYPE) VALUES (%s, %s)", (new_id, "Chef Specialist"))
        elif role_type == "delivery":
            cursor.execute("INSERT INTO DELIVERYSTAFF (STAFF_ID) VALUES (%s)", [new_id])
            
        conn.commit()
        return {"success": True, "id": new_id}
    except Exception as e:
        conn.rollback()
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()

def link_staff_subtype_role(staff_id, role_type):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        active_role = check_existing_role(cursor, staff_id)
        if active_role:
            return {"success": False, "message": f"This employee is already registered as a '{active_role}'."}
        
        if role_type == "manager":
            cursor.execute("INSERT INTO MANAGER (STAFF_ID) VALUES (%s)", [staff_id])
        elif role_type == "chef":
            cursor.execute("INSERT INTO CHEF (STAFF_ID, CHEF_TYPE) VALUES (%s, %s)", (staff_id, "Chef Specialist"))
        elif role_type == "delivery":
            cursor.execute("INSERT INTO DELIVERYSTAFF (STAFF_ID) VALUES (%s)", [staff_id])
            
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()

def update_staff(staff_id, name, salary, password):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE STAFF SET STAFF_NAME = %s, SALARY = %s, PASSWORD = %s WHERE STAFF_ID = %s
        """, (name, float(salary), password, staff_id))
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()

def delete_staff(staff_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM CHEFMANAGESORDER WHERE STAFF_ID = %s", [staff_id])
        cursor.execute("DELETE FROM DELIVERYSTAFFMANAGESORDER WHERE STAFF_ID = %s", [staff_id])
        cursor.execute("DELETE FROM MANAGER WHERE STAFF_ID = %s", [staff_id])
        cursor.execute("DELETE FROM CHEF WHERE STAFF_ID = %s", [staff_id])
        cursor.execute("DELETE FROM DELIVERYSTAFF WHERE STAFF_ID = %s", [staff_id])
        cursor.execute("DELETE FROM STAFF WHERE STAFF_ID = %s", [staff_id])
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()

# ================= PERSONALIZED DASHBOARDS =================
def get_personalized_role_orders(role, staff_id):
    conn = get_connection()
    if not conn: return []
    try:
        cursor = conn.cursor()
        data = []
        
        if role == "manager":
            cursor.execute("""
                SELECT o.ORDER_ID, c.CUST_NAME, o.TOTAL_AMOUNT, o.STATUS
                FROM ORDERS o JOIN CUSTOMER c ON o.CUST_ID = c.CUST_ID ORDER BY o.ORDER_ID DESC
            """)
            for row in cursor.fetchall():
                data.append({"id": row[0], "customer": {"name": row[1]}, "order": {"total": float(row[2]) if row[2] else 0.0}, "status": row[3]})
                
        elif role == "chef":
            cursor.execute("""
                SELECT o.ORDER_ID, c.CUST_NAME, o.STATUS, 
                       COALESCE(string_agg(i.ITEM_NAME || ' (x' || oci.QUANTITY || ')', ', '), 'No Dishes Bound'),
                       c.CUST_PRIMARY_CONTACT, o.TOTAL_AMOUNT, to_char(o.DUE_DATE, 'YYYY-MM-DD'), o.DUE_TIME
                FROM ORDERS o 
                JOIN CUSTOMER c ON o.CUST_ID = c.CUST_ID
                JOIN CHEFMANAGESORDER cmo ON o.ORDER_ID = cmo.ORDER_ID
                LEFT JOIN ORDERCONTAINSMENUITEMS oci ON o.ORDER_ID = oci.ORDER_ID
                LEFT JOIN MENUITEM i ON oci.ITEM_ID = i.ITEM_ID
                WHERE cmo.STAFF_ID = %s
                GROUP BY o.ORDER_ID, c.CUST_NAME, o.STATUS, c.CUST_PRIMARY_CONTACT, o.TOTAL_AMOUNT, o.DUE_DATE, o.DUE_TIME
                ORDER BY o.ORDER_ID DESC
            """, [int(staff_id)])
            for row in cursor.fetchall():
                data.append({
                    "id": row[0], 
                    "customer": {"name": row[1], "phone": row[4] if row[4] else "N/A"}, 
                    "items_summary": row[3], 
                    "status": row[2],
                    "order": {"total": float(row[5]) if row[5] else 0.0},
                    "due_date": row[6] if row[6] else "N/A",
                    "due_time": row[7] if row[7] else "N/A"
                })
                
        elif role == "delivery":
            cursor.execute("""
                SELECT o.ORDER_ID, c.CUST_NAME, o.DELIVERY_ADDRESS, o.TOTAL_AMOUNT, o.STATUS, pm.PAYMENT_METHOD, c.CUST_PRIMARY_CONTACT, c.CUST_SECONDARY_CONTACT, to_char(o.DUE_DATE, 'YYYY-MM-DD'), o.DUE_TIME, pm.PAYMENT_STATUS
                FROM ORDERS o 
                JOIN CUSTOMER c ON o.CUST_ID = c.CUST_ID
                JOIN DELIVERYSTAFFMANAGESORDER dmo ON o.ORDER_ID = dmo.ORDER_ID
                LEFT JOIN PAYMENT pm ON o.ORDER_ID = pm.ORDER_ID 
                WHERE dmo.STAFF_ID = %s
                ORDER BY o.ORDER_ID DESC
            """, [int(staff_id)])
            for row in cursor.fetchall():
                data.append({
                    "id": row[0], 
                    "customer": {
                        "name": row[1], 
                        "address": row[2], 
                        "phone": row[6] if row[6] else "N/A",
                        "phone_secondary": row[7] if row[7] else "N/A"
                    },
                    "order": {"total": float(row[3]) if row[3] else 0.0}, 
                    "status": row[4], 
                    "payment_method": row[5] if row[5] else "Cash",
                    "due_date": row[8] if row[8] else "N/A",
                    "due_time": row[9] if row[9] else "N/A",
                    "payment_status": row[10] if row[10] else "Pending"
                })
        return data
    except Exception as e:
        logger.error(f"Personalized orders query error: {e}")
        return []
    finally:
        cursor.close()
        conn.close()

def update_order_status(order_id, status):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE ORDERS SET STATUS = %s WHERE ORDER_ID = %s", (status, order_id))
        
        if status and status.strip().lower() == 'delivered':
            cursor.execute("UPDATE PAYMENT SET PAYMENT_STATUS = 'Paid' WHERE ORDER_ID = %s", [order_id])
            
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()

# ================= JUNCTION ROUTINES =================
def get_chef_manages():
    conn = get_connection()
    if not conn: return []
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT ORDER_ID, STAFF_ID FROM CHEFMANAGESORDER ORDER BY ORDER_ID")
        data = []
        for row in cursor.fetchall():
            data.append({"order_id": row[0], "chef_id": row[1]})
        return data
    except Exception as e:
        return []
    finally:
        cursor.close()
        conn.close()

def add_chef_manage(order_id, chef_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO CHEFMANAGESORDER (ORDER_ID, STAFF_ID) VALUES (%s, %s)", (int(order_id), int(chef_id)))
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()

def update_chef_manages(order_id, chef_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE CHEFMANAGESORDER SET STAFF_ID = %s WHERE ORDER_ID = %s", (int(chef_id), int(order_id)))
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()

def delete_chef_manage(order_id, chef_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM CHEFMANAGESORDER WHERE ORDER_ID = %s AND STAFF_ID = %s", (int(order_id), int(chef_id)))
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()

def get_delivery_manages():
    conn = get_connection()
    if not conn: return []
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT ORDER_ID, STAFF_ID FROM DELIVERYSTAFFMANAGESORDER ORDER BY ORDER_ID")
        data = []
        for row in cursor.fetchall():
            data.append({"order_id": row[0], "delivery_id": row[1]})
        return data
    except Exception as e:
        return []
    finally:
        cursor.close()
        conn.close()

def add_delivery_manage(order_id, delivery_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO DELIVERYSTAFFMANAGESORDER (ORDER_ID, STAFF_ID) VALUES (%s, %s)", (int(order_id), int(delivery_id)))
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()

def update_delivery_manages(order_id, delivery_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE DELIVERYSTAFFMANAGESORDER SET STAFF_ID = %s WHERE ORDER_ID = %s", (int(delivery_id), int(order_id)))
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()

def delete_delivery_manage(order_id, delivery_id):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM DELIVERYSTAFFMANAGESORDER WHERE ORDER_ID = %s AND STAFF_ID = %s", (int(order_id), int(delivery_id)))
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()

def get_full_menu_deals():
    connection = get_connection()
    if not connection: return []
    cursor = connection.cursor()
    try:
        query = """
        SELECT
            md.DEAL_ID,
            md.DEAL_NAME,
            COALESCE(md.PICTURES_URL, ''),
            mi.ITEM_NAME,
            mdcmi.QUANTITY,
            mi.ITEM_PRICE
        FROM MENUDEAL md
        LEFT JOIN MENUDEALCONTAINSMENUITEMS mdcmi ON md.DEAL_ID = mdcmi.DEAL_ID
        LEFT JOIN MENUITEM mi ON mdcmi.ITEM_ID = mi.ITEM_ID
        ORDER BY md.DEAL_ID
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        deals_map = {}
        for row in rows:
            deal_id = row[0]
            deal_name = row[1]
            picture = row[2]
            item_name = row[3]
            quantity = row[4]
            price = row[5]

            if deal_id not in deals_map:
                deals_map[deal_id] = {
                    "deal_id": deal_id,
                    "deal_name": deal_name,
                    "pictures_url": picture,
                    "items": [],
                    "total_price": 0.0
                }
            if item_name:
                deals_map[deal_id]["items"].append({
                    "item_name": item_name,
                    "quantity": int(quantity) if quantity else 0
                })
                deals_map[deal_id]["total_price"] += float(price) * float(quantity)

        return list(deals_map.values())
    except Exception as e:
        print("GET FULL DEALS ERROR:", e)
        return []
    finally:
        cursor.close()
        connection.close()

def add_order(customer_data, order_data):
    conn = get_connection()
    if not conn:
        return {"success": False, "message": "Failed to connect to database."}
    try:
        cursor = conn.cursor()
        
        # 1. Handle Customer profiles
        cursor.execute("SELECT CUST_ID FROM CUSTOMER WHERE CUST_PRIMARY_CONTACT = %s", [str(customer_data['phone'])])
        row = cursor.fetchone()
        if row:
            cust_id = row[0]
            cursor.execute("""
                UPDATE CUSTOMER SET CUST_NAME = %s, EMAIL = %s WHERE CUST_ID = %s
            """, (customer_data['name'], customer_data['email'], cust_id))
        else:
            cursor.execute("SELECT COALESCE(MAX(CUST_ID), 0) + 1 FROM CUSTOMER")
            cust_id = cursor.fetchone()[0]
            cursor.execute("""
                INSERT INTO CUSTOMER (CUST_ID, CUST_NAME, CUST_PRIMARY_CONTACT, CUST_SECONDARY_CONTACT, EMAIL)
                VALUES (%s, %s, %s, %s, %s)
            """, (cust_id, customer_data['name'], str(customer_data['phone']), str(customer_data['phone']), customer_data['email']))
        
        # 2. Insert into ORDERS
        cursor.execute("SELECT COALESCE(MAX(ORDER_ID), 0) + 1 FROM ORDERS")
        order_id = cursor.fetchone()[0]
        
        total_amount = float(order_data['total'])
        address = customer_data['address']
        status = 'Pending'
        
        cursor.execute("""
            INSERT INTO ORDERS (ORDER_ID, CUST_ID, TOTAL_AMOUNT, ORDER_DATE, DUE_DATE, DUE_TIME, STATUS, DELIVERY_ADDRESS)
            VALUES (%s, %s, %s, CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days', '19:00', %s, %s)
        """, (order_id, cust_id, total_amount, status, address))
        
        # 3. Insert items into ORDERCONTAINSMENUITEMS
        for item in order_data['items']:
            cursor.execute("""
                INSERT INTO ORDERCONTAINSMENUITEMS (ORDER_ID, ITEM_ID, QUANTITY, UNIT)
                VALUES (%s, %s, %s, %s)
            """, (order_id, int(item['id']), float(item['qty']), item.get('unit', 'pcs')))
            
        # 4. Insert into PAYMENT
        cursor.execute("SELECT COALESCE(MAX(PAYMENT_ID), 0) + 1 FROM PAYMENT")
        payment_id = cursor.fetchone()[0]
        payment_method = order_data['payment_method']
        payment_status = "Paid" if payment_method in ["Card", "Online", "Online Transfer"] else "Pending"
        
        cursor.execute("""
            INSERT INTO PAYMENT (PAYMENT_ID, PAYMENT_STATUS, PAYMENT_DATE, PAYMENT_METHOD, ORDER_ID)
            VALUES (%s, %s, CURRENT_DATE, %s, %s)
        """, (payment_id, payment_status, payment_method, order_id))
        
        conn.commit()
        return {"success": True, "order_id": order_id}
    except Exception as e:
        conn.rollback()
        logger.error(f"Error placing order: {e}")
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()