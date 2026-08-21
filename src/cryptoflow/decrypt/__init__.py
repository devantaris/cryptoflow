"""CryptoFlow decryption sub-package.

Re-exports the main decryption entry point::

    from cryptoflow.decrypt import decrypt_bundle
"""

from __future__ import annotations

from cryptoflow.decrypt.pipeline import decrypt_bundle

__all__ = ["decrypt_bundle"]
