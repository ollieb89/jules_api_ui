from pathlib import Path
import secrets
import shutil
import sys


def main():
    backend_dir = Path(__file__).parent.parent
    env_example = backend_dir / ".env.example"
    env_file = backend_dir / ".env"

    if not env_example.exists():
        print(f"Error: {env_example} does not exist.")
        sys.exit(1)

    content = ""
    mode = "create"

    if env_file.exists():
        print(f"Notice: {env_file} already exists. Checking for missing secrets...")
        content = env_file.read_text()
        mode = "update"
    else:
        print(f"Generating {env_file} from {env_example}...")
        content = env_example.read_text()
        mode = "create"

    # Replace empty keys with secure secrets
    lines = content.splitlines()
    new_lines = []
    updated_count = 0

    for line in lines:
        if line.startswith("DJANGO_SECRET_KEY=") and not line.strip().split("=", 1)[1]:
            secret = secrets.token_urlsafe(50)
            new_lines.append(f"DJANGO_SECRET_KEY={secret}")
            updated_count += 1
        elif (
            line.startswith("JULES_ENCRYPTION_KEY=")
            and not line.strip().split("=", 1)[1]
        ):
            secret = secrets.token_urlsafe(44)
            new_lines.append(f"JULES_ENCRYPTION_KEY={secret}")
            updated_count += 1
        else:
            new_lines.append(line)

    # Write to .env
    if updated_count > 0 or mode == "create":
        env_file.write_text("\n".join(new_lines) + "\n")
        if mode == "create":
            print(f"Successfully created .env with generated secrets.")
        else:
            print(f"Successfully updated .env with {updated_count} generated secrets.")
    else:
        print("No changes needed for .env.")


if __name__ == "__main__":
    main()
