from dotenv import load_dotenv

load_dotenv()

from guava import logging_utils
import uvicorn

from relaypro.sidecar import app

if __name__ == "__main__":
    logging_utils.configure_logging()
    uvicorn.run(app, host="0.0.0.0", port=8787)
