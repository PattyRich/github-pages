import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from flask import Flask
from PIL import Image

from imageManager import ImageStore, WikiImageCache


def image_bytes(format_name="PNG", animated=False):
  buffer = io.BytesIO()
  frames = [
    Image.new("RGB", (2, 2), (255, 0, 0)),
    Image.new("RGB", (2, 2), (0, 255