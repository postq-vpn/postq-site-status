// Copied into xray-checker's subscription package by ./Dockerfile.
//
// xray-checker v1.3.1 calls libXray's pre-v26.7 wrapper
// ConvertShareLinksToXrayJson(base64 links) -> base64 {"success","data"}.
// libXray v26.11 removed that wrapper in favour of a JSON Invoke API; the
// conversion itself lives on as share.ConvertShareLinksToXrayJson, which takes
// plain text and returns the same {"outbounds":[...]} document parser.go
// already reads. This restores the old signature on top of it, so parser.go
// stays byte-for-byte upstream apart from the call name.
//
// Delete this file (and the sed in the Dockerfile) once upstream xray-checker
// moves to the new libXray itself.
package subscription

import (
	"encoding/base64"
	"encoding/json"

	"github.com/xtls/libxray/share"
)

func convertShareLinksToXrayJSONCompat(base64Links string) string {
	response := struct {
		Success bool            `json:"success"`
		Data    json.RawMessage `json:"data,omitempty"`
	}{}

	links, err := base64.StdEncoding.DecodeString(base64Links)
	if err == nil {
		// "" = no age secret key: our subscriptions aren't age-encrypted.
		if data, convErr := share.ConvertShareLinksToXrayJson(string(links), ""); convErr == nil {
			response.Success = true
			response.Data = data
		}
	}

	raw, _ := json.Marshal(response)
	return base64.StdEncoding.EncodeToString(raw)
}
