{
  "nodes": [
    {
      "parameters": {
        "method": "POST",
        "url": "https://api.datecode.com.br/v2/dados/consulta",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpBasicAuth",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "numeroTelefone",
              "value": "=62981048778"
            },
            {
              "name": "tipoPessoa",
              "value": "PF"
            }
          ]
        },
        "options": {
          "redirect": {
            "redirect": {}
          }
        }
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        -1248,
        464
      ],
      "id": "6c8febec-d911-48fd-ba02-8a90a459f418",
      "name": "API  de busca Datacode4",
      "credentials": {
        "httpBasicAuth": {
          "id": "pV3i4TUDzIuf3aYm",
          "name": "datecode"
        }
      }
    }
  ],
  "connections": {},
  "pinData": {},
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "8a05fc78259df59f189257d963aa524f06c5b41879917b1259975ab664fbb533"
  }
}