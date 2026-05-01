#include <get_registered_sync_roots.h>
#include <napi_serializers.h>
#include <node_api.h>
#include <windows.h>

napi_value get_registered_sync_roots_wrapper(napi_env env, napi_callback_info args)
{
    std::vector<SyncRoots> roots = get_registered_sync_roots();

    napi_value jsArray;
    napi_create_array_with_length(env, roots.size(), &jsArray);

    for (size_t i = 0; i < roots.size(); i++) {
        napi_value obj;
        napi_create_object(env, &obj);

        napiSetWstring(env, obj, "id", roots[i].id);
        napiSetWstring(env, obj, "path", roots[i].path);
        napiSetWstring(env, obj, "displayName", roots[i].displayName);
        napiSetWstring(env, obj, "version", roots[i].version);

        napi_set_element(env, jsArray, i, obj);
    }

    return jsArray;
}
