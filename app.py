from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import database_manager as db

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return render_template('index_new.html')

# ================= AUTHENTICATION GATEWAY ENDPOINT =================
@app.route('/api/staff/login', methods=['POST'])
def staff_login_endpoint():
    try:
        data = request.json
        result = db.verify_staff_credentials(data['staff_id'], data['password'], data['role'])
        return jsonify(result)
    except Exception as e:
        return jsonify({"auth": False, "message": str(e)})

@app.route('/api/staff/name/<int:staff_id>', methods=['GET'])
def get_staff_name(staff_id):
    if staff_id == 0:
        return jsonify({"success": True, "name": "Admin Manager"})
    conn = db.get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT STAFF_NAME FROM STAFF WHERE STAFF_ID = :1", [staff_id])
        row = cursor.fetchone()
        if row:
            return jsonify({"success": True, "name": row[0]})
        return jsonify({"success": False, "message": "Staff member not found"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})
    finally:
        cursor.close()
        conn.close()

# ================= MENU ENDPOINTS =================
@app.route('/api/menu', methods=['GET'])
def get_menu():
    return jsonify({"success": True, "data": db.get_menu_items()})

@app.route('/api/insert-menu', methods=['POST'])
def insert_menu():
    try:
        data = request.json
        return jsonify(db.add_menu_item(
            data['name'], data['price'], data['category'],
            data.get('staff_id', 7), data.get('serving_size', 1),
            data.get('unit', 'pcs'), data.get('pictures_url', '')
        ))
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/update-menu', methods=['POST'])
def update_menu():
    try:
        data = request.json
        return jsonify(db.update_menu_item(
            data['id'], data['name'], data['price'], data['category'],
            data.get('unit', 'pcs'), data.get('serving_size', 1), data.get('pictures_url', '')
        ))
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/delete-menu/<int:item_id>', methods=['DELETE'])
def delete_menu(item_id):
    return jsonify(db.delete_menu_item(item_id))

# ================= DEALS ENDPOINTS =================
# ================= DEALS ENDPOINTS =================

@app.route('/api/base-deals', methods=['GET'])
def get_base_deals():
    return jsonify({"success": True, "data": db.get_base_deals()})

@app.route('/api/insert-base-deal', methods=['POST'])
def insert_base_deal():
    try:
        data = request.json
        return jsonify(db.add_base_deal(data['name'], data.get('pictures_url', ''), data.get('staff_id', 7)))
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/update-base-deal', methods=['POST'])
def update_base_deal():
    try:
        data = request.json
        return jsonify(db.update_base_deal(data['deal_id'], data['name'], data.get('pictures_url', '')))
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/delete-base-deal/<int:deal_id>', methods=['DELETE'])
def delete_base_deal(deal_id):
    return jsonify(db.delete_base_deal(deal_id))

@app.route('/api/menudeals/full', methods=['GET'])
def get_full_menu_deals():

    try:

        deals = db.get_full_menu_deals()

        return jsonify({
            "success": True,
            "data": deals
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        })

@app.route('/api/deal-items', methods=['GET'])
def get_deal_items():
    return jsonify({"success": True, "data": db.get_deal_items_junction()})

@app.route('/api/insert-deal-item', methods=['POST'])
def insert_deal_item():
    try:
        data = request.json
        return jsonify(
            db.add_deal_item_junction(
                data['deal_id'],
                data['item_id'],
                data['quantity'],
                data.get('unit', 'pcs')
            )
        )
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/update-deal-item', methods=['POST'])
def update_deal_item():
    try:
        data = request.json
        return jsonify(
            db.update_deal_item_junction(
                data['deal_id'],
                data['item_id'],
                data['quantity'],
                data.get('unit', 'pcs')
            )
        )
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/delete-deal-item', methods=['POST'])
def delete_deal_item():
    try:
        data = request.json
        return jsonify(
            db.delete_deal_item_junction(
                data['deal_id'],
                data['item_id']
            )
        )
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

# ================= STAFF ENDPOINTS =================
@app.route('/api/staff', methods=['GET'])
def get_staff():
    return jsonify({"success": True, "data": db.get_staff_data()})

@app.route('/api/insert-staff', methods=['POST'])
def insert_staff():
    try:
        data = request.json
        return jsonify(db.add_staff_comprehensive(data['name'], data.get('salary', 0), data.get('role', 'manager'), data.get('password', '123')))
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/update-staff', methods=['POST'])
def update_staff_route():
    try:
        data = request.json
        return jsonify(db.update_staff(data['id'], data['name'], data.get('salary', 0), data.get('password', '123')))
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/delete-staff/<int:staff_id>', methods=['DELETE'])
def delete_staff(staff_id):
    return jsonify(db.delete_staff(staff_id))

@app.route('/api/staff/assign-role', methods=['POST'])
def assign_staff_role_endpoint():
    try:
        data = request.json
        result = db.link_staff_subtype_role(data['staff_id'], data['role'])
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

# ================= ASSIGNMENT ROUTING =================
@app.route('/api/chef-manages', methods=['GET'])
def get_chef_manages():
    return jsonify({"success": True, "data": db.get_chef_manages()})

@app.route('/api/insert-chef-manage', methods=['POST'])
def insert_chef_manage():
    try:
        data = request.json
        return jsonify(db.add_chef_manage(data['order_id'], data['chef_id']))
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/update-chef-manage', methods=['POST'])
def update_chef_manage():
    try:
        data = request.json
        return jsonify(db.update_chef_manages(data['order_id'], data['chef_id']))
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/delete-chef-manage', methods=['POST'])
def delete_chef_manage():
    try:
        data = request.json
        return jsonify(db.delete_chef_manage(data['order_id'], data['chef_id']))
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/delivery-manages', methods=['GET'])
def get_delivery_manages():
    return jsonify({"success": True, "data": db.get_delivery_manages()})

@app.route('/api/insert-delivery-manage', methods=['POST'])
def insert_delivery_manage():
    try:
        data = request.json
        return jsonify(db.add_delivery_manage(data['order_id'], data['delivery_id']))
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/update-delivery-manage', methods=['POST'])
def update_delivery_manage():
    try:
        data = request.json
        return jsonify(db.update_delivery_manages(data['order_id'], data['delivery_id']))
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/delete-delivery-manage', methods=['POST'])
def delete_delivery_manage():
    try:
        data = request.json
        return jsonify(db.delete_delivery_manage(data['order_id'], data['delivery_id']))
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

# ================= ISOLATED DASHBOARDS RENDERING =================
@app.route('/api/admin/<role>', methods=['GET'])
def admin(role):
    # Backward compatibility for completely open views
    return jsonify({"success": True, "data": db.get_personalized_role_orders(role, 0)})

@app.route('/api/admin/<role>/<int:staff_id>', methods=['GET'])
def admin_personalized(role, staff_id):
    # Fetches tasks linked directly to the authenticated employee identity
    return jsonify({"success": True, "data": db.get_personalized_role_orders(role, staff_id)})

@app.route('/api/update-order-status', methods=['POST'])
def update_status():
    try:
        data = request.json
        return jsonify(db.update_order_status(data['order_id'], data['status']))
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/checkout', methods=['POST'])
def checkout():
    try:
        data = request.json
        customer_data = data['customer']
        order_data = data['order']
        result = db.add_order(customer_data, order_data)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

if __name__ == '__main__':
    app.run(debug=True, port=5444)