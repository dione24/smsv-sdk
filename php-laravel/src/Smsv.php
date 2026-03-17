<?php

namespace SahelPay\Smsv;

use Illuminate\Support\Facades\Facade;

/**
 * @method static array listApps()
 * @method static array createApp(array $payload)
 * @method static array getApp(string $id)
 * @method static array updateApp(string $id, array $payload)
 * @method static array createMetaSender(string $appId, array $payload)
 * @method static array testMetaSender(string $appId, string $senderId, array $payload = [])
 * @method static array refreshMetaToken(string $appId, string $senderId, string $accessToken)
 * @method static array syncMetaTemplates(string $appId, string $senderId)
 * @method static array listMetaTemplates(string $appId, string $senderId)
 * @method static array sendMetaTest(string $appId, string $senderId, array $payload)
 * @method static array initBaileysSender(string $appId, array $payload)
 * @method static array getBaileysQr(string $appId, string $senderId)
 * @method static array getBaileysStatus(string $appId, string $senderId)
 * @method static array disconnectBaileys(string $appId, string $senderId)
 * @method static array reconnectBaileys(string $appId, string $senderId)
 * @method static array listBaileysGroups(string $appId, string $senderId)
 * @method static array listContacts(string $appId, array $query = [])
 * @method static array createContact(string $appId, array $payload)
 * @method static array importContacts(string $appId, array $contacts)
 * @method static array updateContact(string $appId, string $contactId, array $payload)
 * @method static array tagContact(string $appId, string $contactId, array $tags)
 * @method static array optInOutContact(string $appId, string $contactId, array $payload)
 * @method static array listTemplates(string $appId)
 * @method static array previewTemplate(string $appId, string $templateId, array $query = [])
 * @method static array syncTemplates(string $appId)
 * @method static array sendTemplateMessage(string $appId, array $payload)
 * @method static array apiKeyListTemplates(array $query = [])
 * @method static array apiKeySendTemplate(array $payload)
 * @method static array apiKeyListCampaigns(array $query = [])
 * @method static array apiKeyCreateCampaign(array $payload)
 * @method static array apiKeyUpdateCampaign(string $campaignId, array $payload)
 * @method static array apiKeySendCampaign(string $campaignId)
 * @method static array apiKeyPauseCampaign(string $campaignId)
 * @method static array apiKeyResumeCampaign(string $campaignId)
 * @method static array apiKeyCampaignStats(string $campaignId)
 * @method static array sendNotification(array $payload)
 * @method static array sendMessage(array $payload)
 * @method static array sendText(string $to, string $message)
 * @method static array sendTemplateDirect(string $to, string $template, array $variables = [], ?string $language = null)
 */
class Smsv extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return SmsvClient::class;
    }
}
