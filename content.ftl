<#--
Geoserver content.ftl,  transform content into json format.
-->

{
<#assign i = 0 />
<#list type.attributes as attribute>
<#if (i >= 0) && (!attribute.isGeometry)>
"${attribute.name}":
<#list features as feature>
<#assign k = 0 />
<#list feature.attributes as attribute>
<#if (k = i) && (!attribute.isGeometry)>
"${attribute.value}"
</#if>
<#assign k = k+1 />
</#list>
<#if attribute_has_next>
,
</#if>
</#list>
</#if>
<#assign i = i+1 />
</#list>
}
