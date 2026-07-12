using System.Text.Json.Nodes;

namespace OdisseiaWiki.Services.Helpers;

public static class JsonOverrideMerger
{
    public static JsonNode Merge(JsonNode baseNode, JsonNode overrideNode)
    {
        if (baseNode is not JsonObject baseObject || overrideNode is not JsonObject overrideObject)
            return overrideNode.DeepClone();

        var result = baseObject.DeepClone().AsObject();
        foreach (var property in overrideObject)
        {
            if (property.Value is null)
            {
                result[property.Key] = null;
                continue;
            }

            result[property.Key] = result[property.Key] is { } currentValue
                ? Merge(currentValue, property.Value)
                : property.Value.DeepClone();
        }

        return result;
    }
}
