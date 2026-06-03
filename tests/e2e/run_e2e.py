import os
import sys

import pytest


def main():
    args = sys.argv[1:]
    if "--headed" in args:
        args.remove("--headed")
        os.environ["PLAYWRIGHT_HEADLESS"] = "0"

    pytest_args = [
        "tests/e2e",
        "-q",
        "-p",
        "no:cacheprovider",
        "--basetemp=.tmp/pytest-e2e",
        *args,
    ]
    return pytest.main(pytest_args)


if __name__ == "__main__":
    raise SystemExit(main())
