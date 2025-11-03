import datetime, json

def is_valid_date_format(date_str):
    try:
        # Try parsing the string with the expected format
        datetime.datetime.strptime(date_str, "%Y-%m-%d")
        return True
    except ValueError:
        # Raised if the format doesn't match or date is invalid
        return False

def confirm_workflows(workflow: dict):
    triggers = [node for node in workflow["nodes"] if node["type"] == "trigger"]
    if len(triggers) != 1:
        return False,  "Workflow must have one trigger node"
    if len(triggers[0].get("config", {}).get("blocks", [])) == 0:
        return False, "Trigger Block must have one more triggers"
    
    for node in workflow["nodes"]:
        # Triggers
        if node["type"] == "trigger":
            for i in node["config"]["blocks"]:
                # Message Filter Text
                if i["key"] == "message_filter.text":
                    if i.get("settings", {}).get("value", "") == "":
                        return False, "Message Filter Text cannot be empty"
                    if i.get("settings", {}).get("operator", "") == "":
                        return False, "Message Filter Text Operator cannot be empty"
                # Message Filter Type
                if i["key"] == "message_filter.type":
                    if i.get("settings", {}).get("value", "") == "":
                        return False, "Message Filter Type cannot be empty"
                    if i.get("settings", {}).get("operator", "") == "":
                        return False, "Message Filter Type Operator cannot be empty"
        
        # Conditions
        if node["type"] == "condition":
            for i in node.get("config", {}).get("blocks", []):
                # Message Filter Text
                if i["key"] == "message_filter.text":
                    if i.get("settings", {}).get("value", "") == "":
                        return False, "Message Filter Text cannot be empty"
                    if i.get("settings", {}).get("operator", "") == "":
                        return False, "Message Filter Text Operator cannot be empty"
                # Message Filter Type
                if i["key"] == "message_filter.type":
                    if i.get("settings", {}).get("value", "") == "":
                        return False, "Message Filter Type cannot be empty"
                    if i.get("settings", {}).get("operator", "") == "":
                        return False, "Message Filter Type Operator cannot be empty"
                # Message Count
                if i["key"] == "message_count":
                    if i.get("settings", {}).get("value", None) == None or type(i.get("settings", {}).get("value", None)) != int:
                        return False, "Message Count cannot be empty and must be an integer"
                    if i.get("settings", {}).get("operator", "") == "":
                        return False, "Message Count Operator cannot be empty"
                # Conversation Started
                if i["key"] == "conversation_started":
                    if i.get("settings", {}).get("value", "") == "" or not is_valid_date_format(i.get("settings", {}).get("value", "")):
                        return False, "Conversation Started cannot be empty"
                    if i.get("settings", {}).get("operator", "") == "":
                        return False, "Conversation Started Operator cannot be empty"
                # Platform
                if i["key"] == "platform":
                    if i.get("settings", {}).get("value", "") == "":
                        return False, "Platform cannot be empty"
                    if i.get("settings", {}).get("operator", "") == "":
                        return False, "Platform Operator cannot be empty"
                # Integrated Phone Number
                if i["key"] == "integrated_phone_number":
                    if i.get("settings", {}).get("value", "") == "":
                        return False, "Integrated Phone Number cannot be empty"
                    if i.get("settings", {}).get("operator", "") == "":
                        return False, "Integrated Phone Number Operator cannot be empty"
                # Customer Phone Number
                if i["key"] == "customer_phone_number":
                    if i.get("settings", {}).get("value", "") == "":
                        return False, "Customer Phone Number cannot be empty"
                    if i.get("settings", {}).get("operator", "") == "":
                        return False, "Customer Phone Number Operator cannot be empty"
        # Actions
        if node["type"] == "action":
            for i in node.get("config", {}).get("blocks", []):
                # AI Reply
                if i["key"] == "ai_reply":
                    pass
                # Send Message
                if i["key"] == "send_message":
                    if i.get("settings", {}).get("value", "") == "":
                        return False, "Send Message cannot be empty"
        # Delay
        if node["type"] == "delay":
            for i in node["config"].get("blocks", []):
                if i.get("settings", {}).get("value", None) == None or type(i.get("settings", {}).get("value", None)) != int:
                    return False, "Delay cannot be empty and must be an integer"
            
    return True, "Good"