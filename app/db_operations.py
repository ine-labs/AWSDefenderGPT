import sqlite3
import uuid


def create_table():
    conn = sqlite3.connect("aws_scan.db")
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS credentials (
            id TEXT PRIMARY KEY,
            aws_access_key TEXT NOT NULL,
            aws_secret_key TEXT NOT NULL,
            aws_region TEXT NOT NULL,
            openai_access_key TEXT NOT NULL
        )
    """
    )
    cursor.execute(
        """
            CREATE TABLE IF NOT EXISTS scan_details (
                id TEXT PRIMARY KEY,
                resource TEXT NOT NULL,
                resource_name TEXT NOT NULL,  
                resource_arn TEXT NOT NULL,  
                severity TEXT NOT NULL,
                message TEXT NOT NULL,
                issue TEXT NOT NULL,
                details TEXT NOT NULL,
                fixed BOOLEAN DEFAULT false,
                consent BOOLEAN DEFAULT false,
                solution TEXT
            )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS execution_queue (
            id TEXT PRIMARY KEY,
            command TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS scan_queue (
            id TEXT PRIMARY KEY,
            service TEXT NOT NULL,
            regions TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS patch_queue (
            id TEXT PRIMARY KEY,
            finding_id TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS chat_service (
            id TEXT PRIMARY KEY,
            user_message TEXT NOT NULL,
            ai_response TEXT,
            response_status TEXT DEFAULT 'pending',
            user_message_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ai_response_timestamp TIMESTAMP
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY,
            openai_model TEXT DEFAULT 'gpt-3.5-turbo' NOT NULL,
            max_requests INTEGER DEFAULT 15 NOT NULL,
            monitor_mode BOOLEAN DEFAULT TRUE NOT NULL,
            other_settings TEXT 
        )
        """
    )
    cursor.execute(
        """
        INSERT INTO settings (openai_model, max_requests)
        VALUES (?, ?)
        """,
        (
            "gpt-3.5-turbo",
            15,
        ),
    )
    conn.commit()
    conn.close()


def reset_db():
    conn = sqlite3.connect("aws_scan.db")
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS credentials")
    cursor.execute("DROP TABLE IF EXISTS scan_details")
    cursor.execute("DROP TABLE IF EXISTS execution_queue")
    cursor.execute("DROP TABLE IF EXISTS scan_queue")
    conn.commit()
    conn.close()


def store_credentials(aws_access_key, aws_secret_key, aws_region, openai_access_key):
    create_table()
    conn = sqlite3.connect("aws_scan.db")
    cursor = conn.cursor()

    # Check if credentials already exist
    cursor.execute("SELECT * FROM credentials")
    existing_credentials = cursor.fetchone()

    if existing_credentials:
        # Update existing credentials
        cursor.execute(
            """
            UPDATE credentials
            SET aws_access_key=?, aws_secret_key=?, aws_region=?, openai_access_key=?
        """,
            (aws_access_key, aws_secret_key, aws_region, openai_access_key),
        )
    else:
        # Insert new credentials with a random ID
        random_id = str(uuid.uuid4())
        cursor.execute(
            """
            INSERT INTO credentials (id, aws_access_key, aws_secret_key, aws_region, openai_access_key)
            VALUES (?, ?, ?, ?, ?)
        """,
            (random_id, aws_access_key, aws_secret_key, aws_region, openai_access_key),
        )

    conn.commit()
    conn.close()


def save_scan_details(
    resource,
    resource_name,
    resource_arn,
    severity,
    message,
    issue,
    details,
    fixed=False,
    consent=False,
):
    create_table()
    conn = sqlite3.connect("aws_scan.db")
    cursor = conn.cursor()

    # Insert scan details with a random ID
    random_id = str(uuid.uuid4())
    cursor.execute(
        """
            INSERT INTO scan_details (id, resource, resource_name, resource_arn, severity, message, issue, details, fixed, consent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
        (
            random_id,
            resource,
            resource_name,
            resource_arn,
            severity,
            message,
            issue,
            details,
            fixed,
            consent,
        ),
    )
    conn.commit()
    conn.close()


def update_scan_details(id, fixed=None, consent=None, solution=None):
    with sqlite3.connect("aws_scan.db") as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT 1 FROM scan_details WHERE id = ?", (id,))
        if not cursor.fetchone():
            return False

        existing_values = cursor.execute(
            "SELECT fixed, consent, solution FROM scan_details WHERE id = ?", (id,)
        ).fetchone()

        update_query = """
        UPDATE scan_details
        SET
            fixed = ?,
            consent = ?,
            solution = ?
        WHERE id = ?
        """

        update_values = (
            fixed if fixed is not None else existing_values[0],
            consent if consent is not None else existing_values[1],
            solution if solution is not None else existing_values[2],
            id,
        )

        cursor.execute(update_query, update_values)
        conn.commit()
        return True


def get_all_scan_results():
    with sqlite3.connect("aws_scan.db") as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM scan_details")
        column_names = [desc[0] for desc in cursor.description]

        scan_results = []
        for row in cursor.fetchall():
            result_dict = dict(zip(column_names, row))

            # Convert boolean values 0/1 to False/True
            for key in ["fixed", "consent"]:
                result_dict[key] = bool(result_dict[key])

            scan_results.append(result_dict)

    return scan_results


def get_scan_results_by_id(id):
    with sqlite3.connect("aws_scan.db") as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM scan_details WHERE id = ?", (id,))
        column_names = [desc[0] for desc in cursor.description]

        row = cursor.fetchone()
        if row:
            result_dict = dict(zip(column_names, row))
            for key in ["fixed", "consent"]:
                result_dict[key] = bool(result_dict[key])

            return result_dict
        else:
            return None


def get_aws_credentials():
    create_table()
    conn = sqlite3.connect("aws_scan.db")
    cursor = conn.cursor()

    # Fetch AWS credentials
    cursor.execute("SELECT aws_access_key, aws_secret_key, aws_region FROM credentials")
    aws_credentials = cursor.fetchone()

    conn.close()
    return aws_credentials


def get_openai_key():
    create_table()
    conn = sqlite3.connect("aws_scan.db")
    cursor = conn.cursor()

    # Fetch OpenAI key
    cursor.execute("SELECT openai_access_key FROM credentials")
    openai_key = cursor.fetchone()

    conn.close()
    return openai_key[0] if openai_key else ""


def store_execution(command):
    create_table()
    conn = sqlite3.connect("aws_scan.db")
    cursor = conn.cursor()

    # Insert execution details with a random ID
    random_id = str(uuid.uuid4())
    cursor.execute(
        """
        INSERT INTO execution_queue (id, command, status)
        VALUES (?, ?, ?)
        """,
        (random_id, command, "pending"),
    )
    conn.commit()
    conn.close()

    return random_id


def get_execution_by_id(id):
    with sqlite3.connect("aws_scan.db") as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM execution_queue WHERE id = ?", (id,))
        column_names = [desc[0] for desc in cursor.description]

        row = cursor.fetchone()
        if row:
            result_dict = dict(zip(column_names, row))
            return result_dict
        else:
            return None


def update_execution_status(id, status):
    with sqlite3.connect("aws_scan.db") as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT 1 FROM execution_queue WHERE id = ?", (id,))
        if not cursor.fetchone():
            return False

        cursor.execute(
            "UPDATE execution_queue SET status = ? WHERE id = ?", (status, id)
        )
        conn.commit()
        return True


def get_all_execution_logs():
    with sqlite3.connect("aws_scan.db") as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM execution_queue WHERE status = 'pending'")
        column_names = [desc[0] for desc in cursor.description]

        execution_logs = []
        for row in cursor.fetchall():
            result_dict = dict(zip(column_names, row))
            execution_logs.append(result_dict)

    return execution_logs


def add_to_scan_queue(service, regions):
    create_table()
    with sqlite3.connect("aws_scan.db") as conn:
        cursor = conn.cursor()

        # Insert scan details with a random ID
        random_id = str(uuid.uuid4())
        cursor.execute(
            """
            INSERT INTO scan_queue (id, service, regions)
            VALUES (?, ?, ?)
            """,
            (random_id, service, regions),
        )
        conn.commit()
        return random_id


def update_scan_queue_status(id, status):
    with sqlite3.connect("aws_scan.db") as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT 1 FROM scan_queue WHERE id = ?", (id,))
        if not cursor.fetchone():
            return False

        cursor.execute("UPDATE scan_queue SET status = ? WHERE id = ?", (status, id))
        conn.commit()
        return True


def get_scan_status(id):
    with sqlite3.connect("aws_scan.db") as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM scan_queue WHERE id = ?", (id,))
        column_names = [desc[0] for desc in cursor.description]

        row = cursor.fetchone()
        if row:
            result_dict = dict(zip(column_names, row))
            return result_dict
        else:
            return None


def add_to_patch_queue(finding_id):
    create_table()
    with sqlite3.connect("aws_scan.db") as conn:
        cursor = conn.cursor()

        # Insert scan details with a random ID
        random_id = str(uuid.uuid4())
        cursor.execute(
            """
            INSERT INTO patch_queue (id, finding_id)
            VALUES (?, ?)
            """,
            (random_id, finding_id),
        )
        conn.commit()
        return random_id


def update_patch_queue_status(id, status):
    with sqlite3.connect("aws_scan.db") as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT 1 FROM patch_queue WHERE id = ?", (id,))
        if not cursor.fetchone():
            return False

        cursor.execute("UPDATE patch_queue SET status = ? WHERE id = ?", (status, id))
        conn.commit()
        return True


def get_patch_status(id):
    with sqlite3.connect("aws_scan.db") as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM patch_queue WHERE id = ?", (id,))
        column_names = [desc[0] for desc in cursor.description]

        row = cursor.fetchone()
        if row:
            result_dict = dict(zip(column_names, row))
            return result_dict
        else:
            return None


def get_settings():
    with sqlite3.connect("aws_scan.db") as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM settings")
        column_names = [desc[0] for desc in cursor.description]

        row = cursor.fetchone()
        if row:
            result_dict = dict(zip(column_names, row))

            # Convert boolean values in specific fields (modify as needed)
            boolean_fields = ["monitor_mode"]  # Replace with actual boolean field names
            for key, value in result_dict.items():
                if key in boolean_fields and isinstance(value, int) and value in (0, 1):
                    result_dict[key] = bool(value)

            return result_dict
        else:
            return None


def update_settings(**kwargs):
    """Updates settings in the database, handling any number of parameters dynamically."""

    with sqlite3.connect("aws_scan.db") as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT 1 FROM settings")
        if not cursor.fetchone():
            return False

        # Get existing settings dynamically
        existing_settings = {
            row[0]: row[1]
            for row in cursor.execute("SELECT * FROM settings").fetchall()
        }

        # Construct update query with dynamic parameters
        update_query = "UPDATE settings SET " + ", ".join(
            f"{key} = ?" for key in kwargs.keys()
        )

        # Prepare values for update, preserving existing values if not provided
        update_values = [
            kwargs.get(key, existing_settings.get(key)) for key in kwargs.keys()
        ]

        cursor.execute(update_query, update_values)
        conn.commit()
        return True


def add_to_chat_service(user_message):
    create_table()
    with sqlite3.connect("aws_scan.db") as conn:
        cursor = conn.cursor()

        # Insert scan details with a random ID
        random_id = str(uuid.uuid4())
        cursor.execute(
            """
            INSERT INTO chat_service (id, user_message)
            VALUES (?, ?)
            """,
            (random_id, user_message),
        )
        conn.commit()
        return random_id


def update_chat_service(id, ai_response, response_status):
    with sqlite3.connect("aws_scan.db") as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT 1 FROM chat_service WHERE id = ?", (id,))
        if not cursor.fetchone():
            return False

        cursor.execute(
            "UPDATE chat_service SET ai_response = ?, response_status = ?, ai_response_timestamp = CURRENT_TIMESTAMP WHERE id = ?",
            (ai_response, response_status, id),
        )
        conn.commit()
        return True


def get_message_by_id(id):
    with sqlite3.connect("aws_scan.db") as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM chat_service WHERE id = ?", (id,))
        column_names = [desc[0] for desc in cursor.description]

        row = cursor.fetchone()
        if row:
            result_dict = dict(zip(column_names, row))
            return result_dict
        else:
            return None


def get_all_messages():
    create_table()
    with sqlite3.connect("aws_scan.db") as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM chat_service ORDER BY user_message_timestamp")
        column_names = [desc[0] for desc in cursor.description]

        messages = []
        for row in cursor.fetchall():
            result_dict = dict(zip(column_names, row))
            messages.append(result_dict)

    return messages


def clear_all_messages():
    with sqlite3.connect("aws_scan.db") as conn:
        cursor = conn.cursor()

        cursor.execute("DELETE FROM chat_service")
        conn.commit()
        return True
